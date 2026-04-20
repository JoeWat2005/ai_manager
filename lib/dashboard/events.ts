import { prisma } from "@/lib/prisma";

type NotificationType =
  | "lead_captured"
  | "booking_confirmed"
  | "transcript_ready"
  | "billing_changed"
  | "booking_canceled";

type NotificationState = "unread" | "read" | "archived";

type AuditAction =
  | "settings_updated"
  | "customization_updated"
  | "link_created"
  | "link_updated"
  | "link_deleted"
  | "booking_created"
  | "booking_updated"
  | "lead_status_changed"
  | "notification_marked"
  | "organization_updated"
  | "billing_updated";

type NotificationInput = {
  organizationId: string;
  type: NotificationType;
  title: string;
  body: string;
  status?: NotificationState;
  metadataJson?: unknown;
};

type AuditInput = {
  organizationId: string;
  action: AuditAction;
  description: string;
  actorUserId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadataJson?: unknown;
};

export async function createNotificationEvent(input: NotificationInput) {
  return prisma.notificationEvent.create({
    data: {
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      body: input.body,
      status: input.status ?? "unread",
      metadataJson:
        input.metadataJson && typeof input.metadataJson === "object"
          ? (input.metadataJson as object)
          : undefined,
    },
  });
}

export async function createAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      action: input.action,
      description: input.description,
      actorUserId: input.actorUserId ?? null,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadataJson:
        input.metadataJson && typeof input.metadataJson === "object"
          ? (input.metadataJson as object)
          : undefined,
    },
  });
}
