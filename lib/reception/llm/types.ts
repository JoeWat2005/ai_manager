import { AssistantReply, LeadDraft } from "../types";

// --- INPUT SHAPE FOR ANY ASSISTANT ---

export type AssistantInput = {
  orgName: string;      // business name (used for context)
  faqScript: string;    // business FAQs (used by AI for answers)

  message: string;      // current user message

  // Conversation history (for context)
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;

  draft: LeadDraft;     // current collected lead data (name, phone, etc.)

  missingFields: string[]; // what info is still missing (e.g. ["name", "phone"])

  inBusinessHours: boolean; // whether business is open right now
};

// --- PROVIDER INTERFACE ---

// Any assistant (OpenAI, rule-based, etc.) MUST implement this
export interface ReceptionAssistantProvider {

  // Takes input → returns structured reply
  generateReply(input: AssistantInput): Promise<AssistantReply>;
}