import { createOrUpdateLead } from "./lead";
import {
  getOrCreateReceptionistConfig,
  getOrganizationByPhoneExtension,
  getOrganizationBySlug,
} from "./org";
import { upsertReceptionConversation } from "./conversation";
import { normalizeBusinessHours, isWithinBusinessHours } from "./business-hours";

type VoiceEventResult = {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
};

function getHeaderValue(headers: Headers, key: string): string | null {
  const direct = headers.get(key);
  return direct ? direct.trim() : null;
}

function isWebhookAuthorized(headers: Headers): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return false;

  const bearer = getHeaderValue(headers, "authorization");
  const xSecret =
    getHeaderValue(headers, "x-vapi-secret") ??
    getHeaderValue(headers, "x-webhook-secret");

  if (xSecret && xSecret === secret) return true;
  if (bearer && bearer.startsWith("Bearer ") && bearer.slice(7).trim() === secret) {
    return true;
  }
  return false;
}

function pickString(obj: unknown, paths: string[]): string | null {
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
    if (typeof cursor === "string" && cursor.trim().length > 0) {
      return cursor.trim();
    }
  }
  return null;
}

export async function handleVapiVoiceWebhook(req: Request): Promise<VoiceEventResult> {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) {
    return {
      ok: false,
      status: 500,
      body: { ok: false, error: "Missing VAPI_WEBHOOK_SECRET" },
    };
  }

  if (!isWebhookAuthorized(req.headers)) {
    return {
      ok: false,
      status: 401,
      body: { ok: false, error: "Unauthorized webhook signature" },
    };
  }

  const payload = (await req.json()) as Record<string, unknown>;
  const eventType = pickString(payload, ["type", "event.type"]) ?? "unknown";

  const conversationId =
    pickString(payload, ["call.id", "call.callId", "message.call.id", "id"]) ??
    `vapi-${Date.now()}`;

  const orgSlug = pickString(payload, [
    "assistant.metadata.orgSlug",
    "assistant.variableValues.orgSlug",
    "metadata.orgSlug",
    "call.metadata.orgSlug",
    "message.metadata.orgSlug",
  ]);
  const phoneExtension = pickString(payload, [
    "assistant.variableValues.phoneExtension",
    "assistant.metadata.phoneExtension",
    "metadata.phoneExtension",
    "call.metadata.phoneExtension",
    "digits",
  ]);

  if (!orgSlug && !phoneExtension) {
    return {
      ok: false,
      status: 400,
      body: { ok: false, error: "Missing org slug or phone extension in webhook payload" },
    };
  }

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

  if (!org.hasPaidPlan) {
    return {
      ok: false,
      status: 403,
      body: { ok: false, error: "Receptionist is a paid feature" },
    };
  }

  const config = await getOrCreateReceptionistConfig(
    org.id,
    "missing-email@deskcaptain.local"
  );

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
    callbackReason: pickString(payload, ["analysis.structuredData.callbackReason", "lead.callbackReason"]),
  };

  const transcript = pickString(payload, ["transcript", "analysis.summary", "summary"]);
  const now = new Date();
  const inBusinessHours = isWithinBusinessHours(
    normalizeBusinessHours(config.businessHoursJson),
    config.timezone,
    now
  );
  const requestedTransfer = /transfer|human|agent|urgent/i.test(
    `${leadDraft.intent ?? ""} ${transcript ?? ""}`
  );

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
      handoffPolicy:
        inBusinessHours && requestedTransfer && config.transferPhone
          ? "transfer"
          : "callback",
    },
    draft: leadDraft,
  });

  await upsertReceptionConversation({
    organizationId: org.id,
    channel: "phone",
    provider: "vapi",
    providerConversationId: conversationId,
    outcome: lead.qualified ? "qualified_lead" : "incomplete",
    startedAt: now,
    endedAt: now,
    metadataJson: payload,
  });

  return {
    ok: true,
    status: 200,
    body: {
      ok: true,
      eventType,
      leadId: lead.id,
      qualified: lead.qualified,
      handoffPolicy:
        inBusinessHours && requestedTransfer && config.transferPhone
          ? "transfer"
          : "callback",
      recordingDisclosure:
        "This call may be recorded and handled by an AI receptionist for service quality.",
      orgSlug: org.slug,
      phoneExtension: config.phoneExtension,
    },
  };
}
