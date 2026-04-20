import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { prisma } from "@/lib/prisma";

type StaffPatchBody = {
  bookable?: boolean;
  priority?: number;
  timezone?: string;
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

  let body: StaffPatchBody;
  try {
    body = (await req.json()) as StaffPatchBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const profile = await prisma.bookableStaffProfile.findFirst({
    where: {
      id,
      organizationId: access.organization.id,
    },
  });

  if (!profile) {
    return Response.json({ ok: false, error: "Staff profile not found" }, { status: 404 });
  }

  const updated = await prisma.bookableStaffProfile.update({
    where: { id: profile.id },
    data: {
      bookable: typeof body.bookable === "boolean" ? body.bookable : profile.bookable,
      priority:
        typeof body.priority === "number" && Number.isFinite(body.priority)
          ? Math.max(0, Math.floor(body.priority))
          : profile.priority,
      timezone: body.timezone?.trim() || profile.timezone,
    },
  });

  await createAuditLog({
    organizationId: access.organization.id,
    action: "settings_updated",
    actorUserId: access.userId,
    description: `Updated staff profile ${updated.displayName}`,
    targetType: "staff-profile",
    targetId: updated.id,
  });

  return Response.json({ ok: true, profile: updated });
}
