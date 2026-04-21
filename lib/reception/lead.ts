import { prisma } from "@/lib/prisma";
import { createNotificationEvent } from "@/lib/dashboard/events";
import { upsertOrganizationContact } from "@/lib/contacts/service";
import { sendQualifiedLeadNotification } from "./notify";
import { EMPTY_LEAD_DRAFT } from "./defaults";
import { LeadDraft } from "./types";
import { normalizePhone, redactPhone } from "./redaction";

// --- INPUT TYPE FOR LEAD CREATION ---
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

// --- REQUIRED FIELDS TO QUALIFY A LEAD ---
const REQUIRED_QUALIFICATION_FIELDS: Array<keyof LeadDraft> = [
  "name",
  "phone",
  "intent",
];

// --- MERGE EXISTING + NEW DATA ---
export function mergeDraft(
  draft: LeadDraft | null | undefined,
  updates: Partial<LeadDraft>
): LeadDraft {
  return {
    ...EMPTY_LEAD_DRAFT, // start with defaults
    ...(draft ?? {}),    // existing values
    ...updates,          // overwrite with new values
  };
}

// --- FIND WHAT INFO IS MISSING ---
export function getMissingLeadFields(draft: LeadDraft): string[] {
  return REQUIRED_QUALIFICATION_FIELDS.filter((field) => {
    const value = draft[field];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

// --- CHECK IF LEAD IS COMPLETE ---
export function isQualifiedLeadDraft(draft: LeadDraft): boolean {
  return getMissingLeadFields(draft).length === 0;
}

// --- CLEAN STRING INPUT ---
function nonEmpty(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// --- NORMALIZE LEAD DATA ---
export function normalizeLeadDraft(draft: LeadDraft): LeadDraft {
  return {
    name: nonEmpty(draft.name),
    phone: normalizePhone(draft.phone), // normalize phone format
    intent: nonEmpty(draft.intent),
    preferredCallbackWindow: nonEmpty(draft.preferredCallbackWindow),
    callbackReason: nonEmpty(draft.callbackReason),
  };
}

// --- MAIN FUNCTION: CREATE OR UPDATE LEAD ---
export async function createOrUpdateLead(input: LeadCaptureInput) {

  // Clean + normalize incoming draft
  const normalizedDraft = normalizeLeadDraft(input.draft);

  // Check if lead is qualified (has required fields)
  const qualified = isQualifiedLeadDraft(normalizedDraft);

  const providerConversationId = nonEmpty(input.providerConversationId);

  // Ensure contact exists (or create it)
  const contact = await upsertOrganizationContact({
    organizationId: input.organizationId,
    name: normalizedDraft.name,
    phone: normalizedDraft.phone,
  });

  // Try to find existing lead for this conversation
  const existingLead = providerConversationId
    ? await prisma.receptionLead.findFirst({
        where: {
          organizationId: input.organizationId,
          channel: input.channel,
          providerConversationId,
        },
      })
    : null;

  // Prepare DB data
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

    // Only store valid JSON objects
    metadataJson:
      input.metadataJson && typeof input.metadataJson === "object"
        ? (input.metadataJson as object)
        : undefined,
  };

  // --- UPSERT LEAD ---
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

  // --- IF LEAD IS QUALIFIED → TRIGGER SIDE EFFECTS ---
  if (qualified && lead.contact?.name && lead.contact?.phone && lead.intent) {

    // Send email / notification
    const notifyResult = await sendQualifiedLeadNotification({
      toEmail: input.notificationEmail,
      organizationName: input.organizationName,
      channel: input.channel,
      name: lead.contact.name,
      phone: lead.contact.phone,
      intent: lead.intent,
      callbackWindow: lead.preferredCallbackWindow,
    });

    // Create in-app notification
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

    // Log for debugging (with redacted phone)
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
