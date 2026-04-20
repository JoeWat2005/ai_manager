import { prisma } from "@/lib/prisma";
import { createNotificationEvent } from "@/lib/dashboard/events";
import { upsertOrganizationContact } from "@/lib/contacts/service";
import { sendQualifiedLeadNotification } from "./notify";
import { EMPTY_LEAD_DRAFT } from "./defaults";
import { LeadDraft } from "./types";
import { normalizePhone, redactPhone } from "./redaction";

type LeadCaptureInput = {
  organizationId: string;
  organizationName: string;
  notificationEmail: string;
  channel: "phone" | "web";
  providerConversationId?: string | null;
  transcript?: string | null;
  metadataJson?: unknown;
  draft: LeadDraft;
};

const REQUIRED_QUALIFICATION_FIELDS: Array<keyof LeadDraft> = [
  "name",
  "phone",
  "intent",
];

export function mergeDraft(
  draft: LeadDraft | null | undefined,
  updates: Partial<LeadDraft>
): LeadDraft {
  return {
    ...EMPTY_LEAD_DRAFT,
    ...(draft ?? {}),
    ...updates,
  };
}

export function getMissingLeadFields(draft: LeadDraft): string[] {
  return REQUIRED_QUALIFICATION_FIELDS.filter((field) => {
    const value = draft[field];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

export function isQualifiedLeadDraft(draft: LeadDraft): boolean {
  return getMissingLeadFields(draft).length === 0;
}

function nonEmpty(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeLeadDraft(draft: LeadDraft): LeadDraft {
  return {
    name: nonEmpty(draft.name),
    phone: normalizePhone(draft.phone),
    intent: nonEmpty(draft.intent),
    preferredCallbackWindow: nonEmpty(draft.preferredCallbackWindow),
    callbackReason: nonEmpty(draft.callbackReason),
  };
}

export async function createOrUpdateLead(input: LeadCaptureInput) {
  const normalizedDraft = normalizeLeadDraft(input.draft);
  const qualified = isQualifiedLeadDraft(normalizedDraft);
  const providerConversationId = nonEmpty(input.providerConversationId);
  const contact = await upsertOrganizationContact({
    organizationId: input.organizationId,
    name: normalizedDraft.name,
    phone: normalizedDraft.phone,
  });

  const existingLead = providerConversationId
    ? await prisma.receptionLead.findFirst({
        where: {
          organizationId: input.organizationId,
          channel: input.channel,
          providerConversationId,
        },
      })
    : null;

  const data = {
    organizationId: input.organizationId,
    contactId: contact?.id ?? null,
    channel: input.channel,
    intent: normalizedDraft.intent,
    preferredCallbackWindow: normalizedDraft.preferredCallbackWindow,
    callbackReason: normalizedDraft.callbackReason,
    qualified,
    status: "new" as const,
    providerConversationId,
    transcript: nonEmpty(input.transcript),
    metadataJson:
      input.metadataJson && typeof input.metadataJson === "object"
        ? (input.metadataJson as object)
        : undefined,
  };

  const lead = existingLead
    ? await prisma.receptionLead.update({
        where: { id: existingLead.id },
        data,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      })
    : await prisma.receptionLead.create({
        data,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

  if (qualified && lead.contact?.name && lead.contact?.phone && lead.intent) {
    const notifyResult = await sendQualifiedLeadNotification({
      toEmail: input.notificationEmail,
      organizationName: input.organizationName,
      channel: input.channel,
      name: lead.contact.name,
      phone: lead.contact.phone,
      intent: lead.intent,
      callbackWindow: lead.preferredCallbackWindow,
    });

    await createNotificationEvent({
      organizationId: input.organizationId,
      type: "lead_captured",
      title: "Qualified lead captured",
      body: `${lead.contact.name} requested a callback via ${lead.channel}.`,
      metadataJson: {
        leadId: lead.id,
        channel: lead.channel,
      },
    });

    console.log("[Reception lead] Qualified lead stored", {
      leadId: lead.id,
      channel: lead.channel,
      notifySent: notifyResult.sent,
      notifyReason: notifyResult.reason ?? null,
      phone: redactPhone(lead.contact.phone),
    });
  }

  return lead;
}
