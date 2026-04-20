import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { prisma } from "@/lib/prisma";

type UpdateBookingBody = {
  status?: "confirmed" | "completed" | "canceled" | "no_show";
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ ok: false, error: "Booking id is required" }, { status: 400 });
  }

  let body: UpdateBookingBody;
  try {
    body = (await req.json()) as UpdateBookingBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status || !["confirmed", "completed", "canceled", "no_show"].includes(body.status)) {
    return Response.json(
      { ok: false, error: "Invalid booking status" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      organizationId: access.organization.id,
    },
    select: {
      id: true,
      status: true,
      contact: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!booking) {
    return Response.json({ ok: false, error: "Booking not found" }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
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
    data: { status: body.status },
  });

  await createAuditLog({
    organizationId: access.organization.id,
    action: "booking_updated",
    actorUserId: access.userId,
    description: `Booking status changed to ${body.status} for ${booking.contact?.name ?? "unknown contact"}`,
    targetType: "booking",
    targetId: booking.id,
    metadataJson: {
      previousStatus: booking.status,
      nextStatus: body.status,
    },
  });

  return Response.json({ ok: true, booking: updated });
}
