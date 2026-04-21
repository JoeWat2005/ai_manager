// Import access guard (ensures user is authenticated + belongs to an organization)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import audit logging helper (tracks changes made by users)
import { createAuditLog } from "@/lib/dashboard/events";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define expected request body for updating a staff profile
type StaffPatchBody = {
  bookable?: boolean; // whether this staff member can be booked
  priority?: number;  // used for ordering / auto-assignment logic
  timezone?: string;  // staff-specific timezone
};

// Handle PATCH request (update an existing staff profile)
export async function PATCH(
  req: Request,
  // params comes from dynamic route: /api/staff/[id]
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication + organization access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Extract staff profile ID from route
  const { id } = await params;

  // Parse JSON body safely
  let body: StaffPatchBody;
  try {
    body = (await req.json()) as StaffPatchBody;
  } catch {
    // If invalid JSON → return error
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Find the staff profile in the database
  const profile = await prisma.bookableStaffProfile.findFirst({
    where: {
      id,
      // Ensure the profile belongs to the current organization (security check)
      organizationId: access.organization.id,
    },
  });

  // If profile doesn't exist → return 404
  if (!profile) {
    return Response.json(
      { ok: false, error: "Staff profile not found" },
      { status: 404 }
    );
  }

  // Update the staff profile
  const updated = await prisma.bookableStaffProfile.update({
    where: { id: profile.id },

    data: {
      // Update bookable only if explicitly provided
      bookable:
        typeof body.bookable === "boolean"
          ? body.bookable
          : profile.bookable,

      // Validate and normalize priority:
      // - must be a number
      // - must be finite
      // - round down to integer
      // - minimum = 0
      priority:
        typeof body.priority === "number" &&
        Number.isFinite(body.priority)
          ? Math.max(0, Math.floor(body.priority))
          : profile.priority,

      // Update timezone if provided, otherwise keep existing
      timezone: body.timezone?.trim() || profile.timezone,
    },
  });

  // Log this change for auditing purposes
  await createAuditLog({
    organizationId: access.organization.id,
    action: "settings_updated",
    actorUserId: access.userId,

    // Human-readable description of what changed
    description: `Updated staff profile ${updated.displayName}`,

    targetType: "staff-profile",
    targetId: updated.id,
  });

  // Return updated profile
  return Response.json({
    ok: true,
    profile: updated,
  });
}
