import { prisma } from "@/lib/prisma";

// --- INPUT TYPES ---

// Used to create/update a conversation
type UpsertConversationInput = {
  organizationId: string;
  leadId?: string | null;
  channel: "phone" | "web";
  provider: string; // e.g. "web-chat", "vapi"
  providerConversationId: string; // external session ID
  outcome?: string | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  metadataJson?: unknown;
};

// Used to store chat messages
type ConversationMessageInput = {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadataJson?: unknown;
};

// Used to store call recordings + transcripts
type CallRecordingInput = {
  conversationId: string;
  recordingUrl?: string | null;
  storageProvider?: string | null;
  durationSeconds?: number | null;
  transcriptText?: string | null;
  transcriptSummary?: string | null;
  metadataJson?: unknown;
};

// --- UPSERT CONVERSATION ---
// "Create if not exists, otherwise update"
export async function upsertReceptionConversation(input: UpsertConversationInput) {

  // Check if conversation already exists (by provider + external ID)
  const existing = await prisma.receptionConversation.findUnique({
    where: {
      provider_providerConversationId: {
        provider: input.provider,
        providerConversationId: input.providerConversationId,
      },
    },
    select: { id: true },
  });

  // Normalize data before saving
  const data = {
    organizationId: input.organizationId,
    leadId: input.leadId ?? null,
    channel: input.channel,
    provider: input.provider,
    providerConversationId: input.providerConversationId,
    outcome: input.outcome ?? null,
    startedAt: input.startedAt ?? null,
    endedAt: input.endedAt ?? null,
    metadataJson:
      input.metadataJson && typeof input.metadataJson === "object"
        ? (input.metadataJson as object)
        : undefined,
  };

  // Update if exists, otherwise create new
  return existing
    ? prisma.receptionConversation.update({
        where: { id: existing.id },
        data,
      })
    : prisma.receptionConversation.create({ data });
}

// --- APPEND MESSAGES ---
// Adds multiple messages to a conversation
export async function appendConversationMessages(messages: ConversationMessageInput[]) {

  // Clean + validate messages
  const validMessages = messages
    .map((message) => ({
      ...message,
      content: message.content.trim(), // remove whitespace
    }))
    .filter((message) => message.content.length > 0); // remove empty messages

  // Nothing to save → exit early
  if (validMessages.length === 0) {
    return;
  }

  // Bulk insert messages (faster than one-by-one)
  await prisma.receptionConversationMessage.createMany({
    data: validMessages.map((message) => ({
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      metadataJson:
        message.metadataJson && typeof message.metadataJson === "object"
          ? (message.metadataJson as object)
          : undefined,
    })),
  });
}

// --- UPSERT CALL RECORDING ---
// Store or update recording/transcript data for a call
export async function upsertCallRecording(input: CallRecordingInput) {

  // Check if recording already exists for this conversation
  const existing = await prisma.receptionCallRecording.findUnique({
    where: { conversationId: input.conversationId },
    select: { id: true },
  });

  // Normalize fields
  const data = {
    recordingUrl: input.recordingUrl?.trim() || null,
    storageProvider: input.storageProvider?.trim() || null,

    // Validate duration
    durationSeconds:
      typeof input.durationSeconds === "number" && Number.isFinite(input.durationSeconds)
        ? Math.max(0, Math.floor(input.durationSeconds))
        : null,

    transcriptText: input.transcriptText?.trim() || null,
    transcriptSummary: input.transcriptSummary?.trim() || null,

    metadataJson:
      input.metadataJson && typeof input.metadataJson === "object"
        ? (input.metadataJson as object)
        : undefined,
  };

  // Update or create
  return existing
    ? prisma.receptionCallRecording.update({
        where: { id: existing.id },
        data,
      })
    : prisma.receptionCallRecording.create({
        data: {
          conversationId: input.conversationId,
          ...data,
        },
      });
}
