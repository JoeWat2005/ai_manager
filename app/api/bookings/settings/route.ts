// Import access guard (auth + organization check)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import audit logging helper (tracks changes)
import { createAuditLog } from "@/lib/dashboard/events";

// Import helper that ensures booking settings exist (creates default if missing)
import { getOrCreateBookingSettings } from "@/lib/bookings/service";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define expected request body for updating settings
type BookingSettingsBody = {
  timezone?: string;            // e.g. "Europe/London"
  slotLengthMinutes?: number;   // length of booking slots
  instantConfirm?: boolean;     // auto-confirm bookings
  autoAssign?: boolean;         // auto-assign staff
};

// =====================
// GET: Fetch settings
// =====================
export async function GET() {
  // Check user + organization access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Get existing settings OR create defaults if none exist
  const settings = await getOrCreateBookingSettings(access.organization.id);

  // Return settings
  return Response.json({ ok: true, settings });
}

// =====================
// POST: Update settings
// =====================
export async function POST(req: Request) {
  // Check user + organization access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Parse JSON body safely
  let body: BookingSettingsBody;
  try {
    body = (await req.json()) as BookingSettingsBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Load current settings (used as fallback values)
  const current = await getOrCreateBookingSettings(access.organization.id);

  // Update settings in database
  const updated = await prisma.bookingSettings.update({
    where: {
      // Each org has one settings record
      organizationId: access.organization.id,
    },
    data: {
      // Update timezone if provided, otherwise keep existing
      timezone: body.timezone?.trim() || current.timezone,

      // Validate and clamp slot length:
      // - must be a number
      // - round down (Math.floor)
      // - minimum = 15 minutes
      // - maximum = 120 minutes
      slotLengthMinutes:
        typeof body.slotLengthMinutes === "number" &&
        Number.isFinite(body.slotLengthMinutes)
          ? Math.min(Math.max(Math.floor(body.slotLengthMinutes), 15), 120)
          : current.slotLengthMinutes,

      // Update boolean fields only if explicitly provided
      instantConfirm:
        typeof body.instantConfirm === "boolean"
          ? body.instantConfirm
          : current.instantConfirm,

      autoAssign:
        typeof body.autoAssign === "boolean"
          ? body.autoAssign
          : current.autoAssign,
    },
  });

  // Log that settings were updated (audit trail)
  await createAuditLog({
    organizationId: access.organization.id,
    action: "settings_updated",
    actorUserId: access.userId,
    description: "Updated booking settings",
    targetType: "booking-settings",
    targetId: updated.id,
  });

  // Return updated settings
  return Response.json({
    ok: true,
    settings: updated,
  });
}