import { createNotificationEvent } from "@/lib/dashboard/events";
import {
  appendConversationMessages,
  upsertCallRecording,
  upsertReceptionConversation,
} from "./conversation";
import { createOrUpdateLead } from "./lead";
import {
  getOrCreateReceptionistConfig,
  getOrganizationByPhoneExtension,
  getOrganizationBySlug,
} from "./org";
import { normalizeBusinessHours, isWithinBusinessHours } from "./business-hours";

// Standardized result shape for voice webhook responses
type VoiceEventResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

// Read a header and trim whitespace
function getHeaderValue(headers: Headers, key: string): string | null {
  const direct = headers.get(key);
  return direct ? direct.trim() : null;
}

// Check whether webhook request is authorized
function isWebhookAuthorized(headers: Headers): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return false;

  // Support either Authorization: Bearer ... or custom secret headers
  const bearer = getHeaderValue(headers, "authorization");
  const xSecret =
    getHeaderValue(headers, "x-vapi-secret") ??
    getHeaderValue(headers, "x-webhook-secret");

  if (xSecret && xSecret === secret) return true;

  if (
    bearer &&
    bearer.startsWith("Bearer ") &&
    bearer.slice(7).trim() === secret
  ) {
    return true;
  }

  return false;
}

// Safely read a string value from nested payload paths
function pickString(obj: unknown, paths: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;

  for (const path of paths) {
    const segments = path.split(".");
    let cursor: unknown = record;

    // Walk nested object path like "call.metadata.orgSlug"
    for (const segment of segments) {
      if (!cursor || typeof cursor !== "object") {
        cursor = null;
        break;
      }
      cursor = (cursor as Record<string, unknown>)[segment];
    }

    // Return first non-empty string found
    if (typeof cursor === "string" && cursor.trim().length > 0) {
      return cursor.trim();
    }
  }

  return null;
}

// Safely read a number value from nested payload paths
function pickNumber(obj: unknown, paths: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;

  for (const path of paths) {
    const segments = path.split(".");
    let cursor: unknown = record;

    for (const segment of segments) {
      if (!cursor || typeof cursor !== "object") {
        cursor = null;
        break;
      }
      cursor = (cursor as Record<string, unknown>)[segment];
    }

    // Return number directly if already numeric
    if (typeof cursor === "number" && Number.isFinite(cursor)) {
      return cursor;
    }

    // Also allow numeric strings like "42"
    if (typeof cursor === "string" && cursor.trim().length > 0) {
      const parsed = Number(cursor.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

// Main Vapi voice webhook handler
export async function handleVapiVoiceWebhook(
  req: Request
): Promise<VoiceEventResult> {
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  // Server must be configured with webhook secret
  if (!secret) {
    return {
      ok: false,
      status: 500,
      body: { ok: false, error: "Missing VAPI_WEBHOOK_SECRET" },
    };
  }

  // Reject unauthorized requests
  if (!isWebhookAuthorized(req.headers)) {
    return {
      ok: false,
      status: 401,
      body: { ok: false, error: "Unauthorized webhook signature" },
    };
  }

  // Parse webhook payload
  const payload = (await req.json()) as Record<string, unknown>;

  // Try to identify event type from a few possible payload shapes
  const eventType = pickString(payload, ["type", "event.type"]) ?? "unknown";

  // Try to identify conversation/call ID
  const conversationId =
    pickString(payload, ["call.id", "call.callId", "message.call.id", "id"]) ??
    `vapi-${Date.now()}`;

  // Organization can be identified by slug...
  const orgSlug = pickString(payload, [
    "assistant.metadata.orgSlug",
    "assistant.variableValues.orgSlug",
    "metadata.orgSlug",
    "call.metadata.orgSlug",
    "message.metadata.orgSlug",
  ]);

  // ...or by phone extension
  const phoneExtension = pickString(payload, [
    "assistant.variableValues.phoneExtension",
    "assistant.metadata.phoneExtension",
    "metadata.phoneExtension",
    "call.metadata.phoneExtension",
    "digits",
  ]);

  // Need at least one way to identify the organization
  if (!orgSlug && !phoneExtension) {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        error: "Missing org slug or phone extension in webhook payload",
      },
    };
  }

  // Look up organization by slug first, otherwise phone extension
  const org = orgSlug
    ? await getOrganizationBySlug(orgSlug)
    : await getOrganizationByPhoneExtension(phoneExtension!);

  if (!org) {
    return {
      ok: false,
      status: 404,
      body: {
        ok: false,
        error: "Organization not found",
        prompt:
          "Invalid extension. Please try again. If you need assistance, stay on the line for a callback request.",
      },
    };
  }

  // Voice receptionist is a paid feature
  if (!org.hasPaidPlan) {
    return {
      ok: false,
      status: 403,
      body: { ok: false, error: "Receptionist is a paid feature" },
    };
  }

  // Ensure org receptionist config exists
  const config = await getOrCreateReceptionistConfig(
    org.id,
    "missing-email@deskcaptain.local"
  );

  // Build lead draft from whatever structured data the webhook contains
  const leadDraft = {
    name: pickString(payload, [
      "analysis.structuredData.name",
      "extracted.name",
      "lead.name",
    ]),
    phone: pickString(payload, [
      "customer.number",
      "call.customer.number",
      "analysis.structuredData.phone",
      "lead.phone",
    ]),
    intent: pickString(payload, [
      "analysis.structuredData.intent",
      "lead.intent",
      "summary",
      "transcript",
    ]),
    preferredCallbackWindow: pickString(payload, [
      "analysis.structuredData.preferredCallbackWindow",
      "lead.preferredCallbackWindow",
    ]),
    callbackReason: pickString(payload, [
      "analysis.structuredData.callbackReason",
      "lead.callbackReason",
    ]),
  };

  // Extract transcript / recording info if available
  const transcript = pickString(payload, ["transcript", "analysis.summary", "summary"]);
  const recordingUrl = pickString(payload, [
    "recording.url",
    "recordingUrl",
    "call.recordingUrl",
    "call.recording.url",
  ]);
  const recordingProvider = pickString(payload, [
    "recording.provider",
    "call.recording.provider",
    "recordingProvider",
  ]);
  const recordingDuration = pickNumber(payload, [
    "recording.durationSeconds",
    "call.durationSeconds",
    "analysis.durationSeconds",
  ]);

  const now = new Date();

  // Determine whether business is open right now
  const inBusinessHours = isWithinBusinessHours(
    normalizeBusinessHours(config.businessHoursJson),
    config.timezone,
    now
  );

  // Look for words that imply escalation / transfer request
  const requestedTransfer = /transfer|human|agent|urgent/i.test(
    `${leadDraft.intent ?? ""} ${transcript ?? ""}`
  );

  // Create or update lead record from voice interaction
  const lead = await createOrUpdateLead({
    organizationId: org.id,
    organizationName: org.name,
    notificationEmail: config.notificationEmail,
    channel: "phone",
    providerConversationId: conversationId,
    transcript,
    metadataJson: {
      eventType,
      provider: "vapi",
      inBusinessHours,
      requestedTransfer,
      transferPhoneConfigured: !!config.transferPhone,

      // Decide transfer vs callback policy
      handoffPolicy:
        inBusinessHours && requestedTransfer && config.transferPhone
          ? "transfer"
          : "callback",
    },
    draft: leadDraft,
  });

  // Create or update conversation record
  const conversation = await upsertReceptionConversation({
    organizationId: org.id,
    leadId: lead.id,
    channel: "phone",
    provider: "vapi",
    providerConversationId: conversationId,
    outcome: lead.qualified ? "qualified_lead" : "incomplete",
    startedAt: now,
    endedAt: now,
    metadataJson: payload, // store raw webhook payload for debugging/audit
  });

  // Save transcript as a conversation message
  if (transcript) {
    await appendConversationMessages([
      {
        conversationId: conversation.id,
        role: "user",
        content: transcript,
        metadataJson: {
          source: "voice-transcript",
        },
      },
    ]);
  }

  // Save call recording/transcript if available
  if (recordingUrl || transcript) {
    await upsertCallRecording({
      conversationId: conversation.id,
      recordingUrl,
      storageProvider: recordingProvider,
      durationSeconds: recordingDuration,
      transcriptText: transcript,
      transcriptSummary: pickString(payload, ["analysis.summary", "summary"]),
      metadataJson: {
        eventType,
      },
    });

    // Notify dashboard that transcript is ready
    await createNotificationEvent({
      organizationId: org.id,
      type: "transcript_ready",
      title: "Call transcript ready",
      body: `Call transcript captured for ${org.name}`,
      metadataJson: {
        conversationId: conversation.id,
        leadId: lead.id,
      },
    });
  }

  // Return webhook success response
  return {
    ok: true,
    status: 200,
    body: {
      ok: true,
      eventType,
      leadId: lead.id,
      qualified: lead.qualified,

      // Return chosen policy so upstream system can act on it
      handoffPolicy:
        inBusinessHours && requestedTransfer && config.transferPhone
          ? "transfer"
          : "callback",

      // Disclosure text for call recording / AI use
      recordingDisclosure:
        "This call may be recorded and handled by an AI receptionist for service quality.",

      orgSlug: org.slug,
      phoneExtension: config.phoneExtension,
    },
  };
}