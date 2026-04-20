import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { getOrCreateBookingSettings } from "@/lib/bookings/service";
import { prisma } from "@/lib/prisma";

type BookingSettingsBody = {
  timezone?: string;
  slotLengthMinutes?: number;
  instantConfirm?: boolean;
  autoAssign?: boolean;
};

export async function GET() {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const settings = await getOrCreateBookingSettings(access.organization.id);
  return Response.json({ ok: true, settings });
}

export async function POST(req: Request) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  let body: BookingSettingsBody;
  try {
    body = (await req.json()) as BookingSettingsBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const current = await getOrCreateBookingSettings(access.organization.id);

  const updated = await prisma.bookingSettings.update({
    where: {
      organizationId: access.organization.id,
    },
    data: {
      timezone: body.timezone?.trim() || current.timezone,
      slotLengthMinutes:
        typeof body.slotLengthMinutes === "number" && Number.isFinite(body.slotLengthMinutes)
          ? Math.min(Math.max(Math.floor(body.slotLengthMinutes), 15), 120)
          : current.slotLengthMinutes,
      instantConfirm:
        typeof body.instantConfirm === "boolean"
          ? body.instantConfirm
          : current.instantConfirm,
      autoAssign:
        typeof body.autoAssign === "boolean" ? body.autoAssign : current.autoAssign,
    },
  });

  await createAuditLog({
    organizationId: access.organization.id,
    action: "settings_updated",
    actorUserId: access.userId,
    description: "Updated booking settings",
    targetType: "booking-settings",
    targetId: updated.id,
  });

  return Response.json({ ok: true, settings: updated });
}
