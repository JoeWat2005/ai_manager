import { AssistantReply, LeadDraft } from "../types";

export type AssistantInput = {
  orgName: string;
  faqScript: string;
  message: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  draft: LeadDraft;
  missingFields: string[];
  inBusinessHours: boolean;
};

export interface ReceptionAssistantProvider {
  generateReply(input: AssistantInput): Promise<AssistantReply>;
}
