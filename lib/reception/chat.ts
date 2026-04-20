import { normalizeBusinessHours, isWithinBusinessHours } from "./business-hours";
import {
  appendConversationMessages,
  upsertReceptionConversation,
} from "./conversation";
import { getReceptionAssistantProvider } from "./llm";
import {
  createOrUpdateLead,
  getMissingLeadFields,
  isQualifiedLeadDraft,
  mergeDraft,
  normalizeLeadDraft,
} from "./lead";
import { ChatTurnResult, LeadDraft } from "./types";

type HandleChatTurnInput = {
  organizationId: string;
  organizationName: string;
  notificationEmail: string;
  faqScript: string;
  businessHoursJson: unknown;
  timezone: string;
  sessionId: string;
  message: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  draft: LeadDraft | null;
};

export async function handleChatTurn(
  input: HandleChatTurnInput
): Promise<ChatTurnResult> {
  const normalizedDraft = normalizeLeadDraft(mergeDraft(input.draft, {}));
  const missingFields = getMissingLeadFields(normalizedDraft);
  const provider = getReceptionAssistantProvider();
  const hours = normalizeBusinessHours(input.businessHoursJson);
  const inBusinessHours = isWithinBusinessHours(hours, input.timezone);

  const assistantReply = await provider.generateReply({
    orgName: input.organizationName,
    faqScript: input.faqScript,
    message: input.message,
    history: input.history,
    draft: normalizedDraft,
    missingFields,
    inBusinessHours,
  });

  const updatedDraft = normalizeLeadDraft(
    mergeDraft(normalizedDraft, assistantReply.draftUpdates)
  );
  const qualified = isQualifiedLeadDraft(updatedDraft);

  const lead = await createOrUpdateLead({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    notificationEmail: input.notificationEmail,
    channel: "web",
    providerConversationId: input.sessionId,
    transcript: input.message,
    metadataJson: {
      provider: "web-chat",
      escalationRequested: assistantReply.shouldEscalate,
      inBusinessHours,
    },
    draft: updatedDraft,
  });

  const conversation = await upsertReceptionConversation({
    organizationId: input.organizationId,
    leadId: lead.id,
    channel: "web",
    provider: "web-chat",
    providerConversationId: input.sessionId,
    outcome: qualified ? "qualified_lead" : "in_progress",
    startedAt: null,
    endedAt: qualified ? new Date() : null,
    metadataJson: {
      escalationRequested: assistantReply.shouldEscalate,
      inBusinessHours,
    },
  });

  await appendConversationMessages([
    {
      conversationId: conversation.id,
      role: "user",
      content: input.message,
    },
    {
      conversationId: conversation.id,
      role: "assistant",
      content: qualified
        ? "Thanks. We have your details and will call you back shortly."
        : assistantReply.message,
    },
  ]);

  const nextFieldsNeeded = getMissingLeadFields(updatedDraft);

  return {
    assistantMessage: qualified
      ? "Thanks. We have your details and will call you back shortly."
      : assistantReply.message,
    leadCaptureState:
      qualified ? "qualified" : nextFieldsNeeded.length > 0 ? "collecting" : "not-qualified",
    nextFieldsNeeded,
    draft: updatedDraft,
    qualified: lead.qualified,
  };
}

