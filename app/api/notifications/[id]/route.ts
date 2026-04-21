// Import access guard (checks auth + organization access)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import audit logging helper
import { createAuditLog } from "@/lib/dashboard/events";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define the expected shape of the PATCH request body
type NotificationPatchBody = {
  // Allowed notification statuses
  status?: "unread" | "read" | "archived";
};

// Handle PATCH request for one notification
export async function PATCH(
  req: Request,
  // Route params from a dynamic route like /notifications/[id]
  { params }: { params: Promise<{ id: string }> }
) {
  // Make sure the user is signed in and belongs to an org
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Extract the notification ID from the URL
  const { id } = await params;

  // Safely parse the JSON request body
  let body: NotificationPatchBody;
  try {
    body = (await req.json()) as NotificationPatchBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate that status exists and is one of the allowed values
  if (!body.status || !["unread", "read", "archived"].includes(body.status)) {
    return Response.json(
      { ok: false, error: "Invalid notification status" },
      { status: 400 }
    );
  }

  // Find the notification, but only if it belongs to this organization
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

  // If not found, return 404
  if (!notification) {
    return Response.json(
      { ok: false, error: "Notification not found" },
      { status: 404 }
    );
  }

  // Update the notification status
  const updated = await prisma.notificationEvent.update({
    where: { id: notification.id },
    data: {
      status: body.status,

      // Set readAt only when marking as "read"
      // Otherwise clear it
      readAt: body.status === "read" ? new Date() : null,
    },
  });

  // Create an audit log showing the status change
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

  // Return the updated notification
  return Response.json({
    ok: true,
    notification: updated,
  });
}