import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { prisma } from "@/lib/prisma";

type NotificationPatchBody = {
  status?: "unread" | "read" | "archived";
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

  let body: NotificationPatchBody;
  try {
    body = (await req.json()) as NotificationPatchBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status || !["unread", "read", "archived"].includes(body.status)) {
    return Response.json({ ok: false, error: "Invalid notification status" }, { status: 400 });
  }

  const notification = await prisma.notificationEvent.findFirst({
    where: {
      id,
      organizationId: access.organization.id,
    },
    select: {
      id: true,
      status: true,
      title: true,
    },
  });

  if (!notification) {
    return Response.json({ ok: false, error: "Notification not found" }, { status: 404 });
  }

  const updated = await prisma.notificationEvent.update({
    where: { id: notification.id },
    data: {
      status: body.status,
      readAt: body.status === "read" ? new Date() : null,
    },
  });

  await createAuditLog({
    organizationId: access.organization.id,
    action: "notification_marked",
    actorUserId: access.userId,
    description: `Notification ${notification.title} marked ${body.status}`,
    targetType: "notification",
    targetId: notification.id,
    metadataJson: {
      previousStatus: notification.status,
      nextStatus: body.status,
    },
  });

  return Response.json({ ok: true, notification: updated });
}
