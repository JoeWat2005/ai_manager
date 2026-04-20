import { extractLeadDraftUpdates } from "../parsing";
import { AssistantInput, ReceptionAssistantProvider } from "./types";

function nextQuestion(missingFields: string[]): string {
  if (missingFields.includes("name")) {
    return "Could you share your name so I can log your request?";
  }
  if (missingFields.includes("phone")) {
    return "Please share the best callback phone number.";
  }
  if (missingFields.includes("intent")) {
    return "What do you need help with today?";
  }
  return "Thanks. Is there anything else you'd like us to note for your callback?";
}

export class RuleBasedReceptionProvider implements ReceptionAssistantProvider {
  async generateReply(input: AssistantInput) {
    const draftUpdates = extractLeadDraftUpdates(input.message);
    const prompt = nextQuestion(input.missingFields);

    const businessHoursMsg = input.inBusinessHours
      ? "We're currently in business hours and can try to transfer urgent calls if needed."
      : "We're outside business hours, but we'll schedule a callback.";

    return {
      message: `${prompt} ${businessHoursMsg}`,
      draftUpdates,
      shouldEscalate:
        input.message.toLowerCase().includes("urgent") ||
        input.message.toLowerCase().includes("human"),
    };
  }
}
