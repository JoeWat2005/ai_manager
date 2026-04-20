import { prisma } from "@/lib/prisma";

type UpsertConversationInput = {
  organizationId: string;
  leadId?: string | null;
  channel: "phone" | "web";
  provider: string;
  providerConversationId: string;
  outcome?: string | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  metadataJson?: unknown;
};

type ConversationMessageInput = {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadataJson?: unknown;
};

type CallRecordingInput = {
  conversationId: string;
  recordingUrl?: string | null;
  storageProvider?: string | null;
  durationSeconds?: number | null;
  transcriptText?: string | null;
  transcriptSummary?: string | null;
  metadataJson?: unknown;
};

export async function upsertReceptionConversation(input: UpsertConversationInput) {
  const existing = await prisma.receptionConversation.findUnique({
    where: {
      provider_providerConversationId: {
        provider: input.provider,
        providerConversationId: input.providerConversationId,
      },
    },
    select: { id: true },
  });

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

  return existing
    ? prisma.receptionConversation.update({
        where: { id: existing.id },
        data,
      })
    : prisma.receptionConversation.create({ data });
}

export async function appendConversationMessages(messages: ConversationMessageInput[]) {
  const validMessages = messages
    .map((message) => ({
      ...message,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);

  if (validMessages.length === 0) {
    return;
  }

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

export async function upsertCallRecording(input: CallRecordingInput) {
  const existing = await prisma.receptionCallRecording.findUnique({
    where: { conversationId: input.conversationId },
    select: { id: true },
  });

  const data = {
    recordingUrl: input.recordingUrl?.trim() || null,
    storageProvider: input.storageProvider?.trim() || null,
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

