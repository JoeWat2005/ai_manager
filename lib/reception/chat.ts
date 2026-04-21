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

// Input for one chat turn
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

// --- MAIN CHAT ENGINE ---
export async function handleChatTurn(
  input: HandleChatTurnInput
): Promise<ChatTurnResult> {

  // --- PREPARE LEAD STATE ---

  // Merge existing draft and normalize it (clean structure)
  const normalizedDraft = normalizeLeadDraft(
    mergeDraft(input.draft, {})
  );

  // Determine what info is still missing (name, phone, intent, etc.)
  const missingFields = getMissingLeadFields(normalizedDraft);

  // Get AI provider (OpenAI or rule-based)
  const provider = getReceptionAssistantProvider();

  // Normalize business hours config
  const hours = normalizeBusinessHours(input.businessHoursJson);

  // Check if business is currently open
  const inBusinessHours = isWithinBusinessHours(hours, input.timezone);

  // --- GENERATE AI RESPONSE ---

  const assistantReply = await provider.generateReply({
    orgName: input.organizationName,
    faqScript: input.faqScript,
    message: input.message,
    history: input.history,
    draft: normalizedDraft,
    missingFields,
    inBusinessHours,
  });

  // --- UPDATE LEAD DATA ---

  // Merge AI-extracted data into draft
  const updatedDraft = normalizeLeadDraft(
    mergeDraft(normalizedDraft, assistantReply.draftUpdates)
  );

  // Check if lead is "complete" (qualified)
  const qualified = isQualifiedLeadDraft(updatedDraft);

  // --- SAVE / UPDATE LEAD IN DB ---

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

  // --- SAVE / UPDATE CONVERSATION ---

  const conversation = await upsertReceptionConversation({
    organizationId: input.organizationId,
    leadId: lead.id,

    channel: "web",
    provider: "web-chat",
    providerConversationId: input.sessionId,

    // Conversation outcome depends on qualification
    outcome: qualified ? "qualified_lead" : "in_progress",

    startedAt: null,
    endedAt: qualified ? new Date() : null,

    metadataJson: {
      escalationRequested: assistantReply.shouldEscalate,
      inBusinessHours,
    },
  });

  // --- STORE CHAT MESSAGES ---

  await appendConversationMessages([
    {
      conversationId: conversation.id,
      role: "user",
      content: input.message,
    },
    {
      conversationId: conversation.id,
      role: "assistant",

      // If qualified → override AI response with final message
      content: qualified
        ? "Thanks. We have your details and will call you back shortly."
        : assistantReply.message,
    },
  ]);

  // --- DETERMINE NEXT STATE ---

  const nextFieldsNeeded = getMissingLeadFields(updatedDraft);

  return {

    // Final message shown to user
    assistantMessage: qualified
      ? "Thanks. We have your details and will call you back shortly."
      : assistantReply.message,

    // Lead capture state machine
    leadCaptureState:
      qualified
        ? "qualified"
        : nextFieldsNeeded.length > 0
        ? "collecting"
        : "not-qualified",

    nextFieldsNeeded,   // what to ask next
    draft: updatedDraft, // updated lead data
    qualified: lead.qualified, // final DB truth
  };
}

