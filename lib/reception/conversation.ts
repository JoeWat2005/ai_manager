import { prisma } from "@/lib/prisma";

type UpsertConversationInput = {
  organizationId: string;
  channel: "phone" | "web";
  provider: string;
  providerConversationId: string;
  outcome?: string | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  metadataJson?: unknown;
};

export async function upsertReceptionConversation(
  input: UpsertConversationInput
) {
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
