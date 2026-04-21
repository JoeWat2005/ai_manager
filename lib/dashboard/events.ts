import { prisma } from "@/lib/prisma";

// --- TYPES ---

// Types of notifications shown to users
type NotificationType =
  | "lead_captured"
  | "booking_confirmed"
  | "transcript_ready"
  | "billing_changed"
  | "booking_canceled";

// Status of a notification
type NotificationState = "unread" | "read" | "archived";

// Types of audit actions (internal tracking)
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

// Input for creating a notification
type NotificationInput = {
  organizationId: string;
  type: NotificationType;
  title: string;
  body: string;
  status?: NotificationState; // defaults to "unread"
  metadataJson?: unknown;     // optional extra data
};

// Input for creating an audit log
type AuditInput = {
  organizationId: string;
  action: AuditAction;
  description: string;
  actorUserId?: string | null; // who performed the action
  targetType?: string | null;  // what was affected (e.g. "booking")
  targetId?: string | null;    // specific entity ID
  metadataJson?: unknown;      // optional extra data
};

// --- NOTIFICATIONS ---

// Create a user-facing notification
export async function createNotificationEvent(input: NotificationInput) {
  return prisma.notificationEvent.create({
    data: {
      organizationId: input.organizationId,

      type: input.type,   // what happened (e.g. booking_confirmed)
      title: input.title, // short title
      body: input.body,   // detailed message

      // Default to "unread" if not provided
      status: input.status ?? "unread",

      // Only store metadata if it's a valid object
      metadataJson:
        input.metadataJson && typeof input.metadataJson === "object"
          ? (input.metadataJson as object)
          : undefined,
    },
  });
}

// --- AUDIT LOGS ---

// Create an internal audit log (for tracking actions)
export async function createAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,

      action: input.action,         // what action occurred
      description: input.description, // human-readable explanation

      actorUserId: input.actorUserId ?? null, // who did it

      targetType: input.targetType ?? null, // e.g. "booking"
      targetId: input.targetId ?? null,     // e.g. booking ID

      // Optional structured metadata
      metadataJson:
        input.metadataJson && typeof input.metadataJson === "object"
          ? (input.metadataJson as object)
          : undefined,
    },
  });
}
