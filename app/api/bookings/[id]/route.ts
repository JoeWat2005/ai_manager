// Import access guard (checks auth + organization access)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import helper to create an audit log entry (tracking changes)
import { createAuditLog } from "@/lib/dashboard/events";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define the expected shape of the request body
type UpdateBookingBody = {
  // Optional field, but if present must be one of these values
  status?: "confirmed" | "completed" | "canceled" | "no_show";
};

// Handle PATCH requests (used for updating existing data)
export async function PATCH(
  req: Request,
  // params comes from the dynamic route (e.g. /api/bookings/[id])
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication + organization access
  const access = await requireDashboardApiOrg();

  // If access fails, return the appropriate error response
  if (!access.ok) {
    return access.response;
  }

  // Extract the booking ID from route params
  const { id } = await params;

  // If no ID was provided, return a 400 (bad request)
  if (!id) {
    return Response.json(
      { ok: false, error: "Booking id is required" },
      { status: 400 }
    );
  }

  // Parse the JSON body safely
  let body: UpdateBookingBody;
  try {
    body = (await req.json()) as UpdateBookingBody;
  } catch {
    // If JSON parsing fails, return error
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate the status field
  // - must exist
  // - must be one of the allowed values
  if (
    !body.status ||
    !["confirmed", "completed", "canceled", "no_show"].includes(body.status)
  ) {
    return Response.json(
      { ok: false, error: "Invalid booking status" },
      { status: 400 }
    );
  }

  // Find the booking in the database
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      // Ensure booking belongs to the current organization (important security check)
      organizationId: access.organization.id,
    },
    select: {
      id: true,
      status: true,
      contact: {
        select: {
          name: true, // used for audit log message
        },
      },
    },
  });

  // If booking doesn't exist or doesn't belong to this org → 404
  if (!booking) {
    return Response.json(
      { ok: false, error: "Booking not found" },
      { status: 404 }
    );
  }

  // Update the booking status in the database
  const updated = await prisma.booking.update({
    where: { id: booking.id },

    // Include related data to return in response
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      staffProfile: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },

    // Apply the new status
    data: { status: body.status },
  });

  // Fire audit log without awaiting — keeps it off the response critical path.
  void createAuditLog({
    organizationId: access.organization.id,
    action: "booking_updated",
    actorUserId: access.userId,
    description: `Booking status changed to ${body.status} for ${
      booking.contact?.name ?? "unknown contact"
    }`,
    targetType: "booking",
    targetId: booking.id,
    metadataJson: {
      previousStatus: booking.status,
      nextStatus: body.status,
    },
  }).catch(console.error);

  // Return success response with updated booking
  return Response.json({
    ok: true,
    booking: updated,
  });
}