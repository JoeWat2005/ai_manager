import { extractLeadDraftUpdates } from "../parsing";
import { AssistantInput, ReceptionAssistantProvider } from "./types";

// Decide what question to ask next based on missing info
function nextQuestion(missingFields: string[]): string {

  // Ask for name first
  if (missingFields.includes("name")) {
    return "Could you share your name so I can log your request?";
  }

  // Then phone number
  if (missingFields.includes("phone")) {
    return "Please share the best callback phone number.";
  }

  // Then intent (what they want)
  if (missingFields.includes("intent")) {
    return "What do you need help with today?";
  }

  // If nothing missing → generic follow-up
  return "Thanks. Is there anything else you'd like us to note for your callback?";
}

// Rule-based provider (no AI model)
export class RuleBasedReceptionProvider implements ReceptionAssistantProvider {

  async generateReply(input: AssistantInput) {

    // --- EXTRACT STRUCTURED DATA ---
    // Pull name/phone/etc. from message using your parser
    const draftUpdates = extractLeadDraftUpdates(input.message);

    // --- DECIDE NEXT QUESTION ---
    const prompt = nextQuestion(input.missingFields);

    // --- BUSINESS HOURS CONTEXT ---
    const businessHoursMsg = input.inBusinessHours
      ? "We're currently in business hours and can try to transfer urgent calls if needed."
      : "We're outside business hours, but we'll schedule a callback.";

    // --- RETURN RESPONSE ---
    return {
      message: `${prompt} ${businessHoursMsg}`, // combined response

      draftUpdates, // structured data extracted from message

      // Escalate if user signals urgency or wants human
      shouldEscalate:
        input.message.toLowerCase().includes("urgent") ||
        input.message.toLowerCase().includes("human"),
    };
  }
}