import { extractLeadDraftUpdates } from "../parsing";
import { AssistantInput, ReceptionAssistantProvider } from "./types";

// Shape of OpenAI API response (simplified)
type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

// --- HELPER: Extract JSON safely from LLM response ---
function parseJsonResponse(content: string | null | undefined): {
  message?: string;
  shouldEscalate?: boolean;
  draftUpdates?: Record<string, string>;
} | null {

  // If no content → fail
  if (!content) return null;

  // Find JSON inside text (LLMs sometimes add extra text)
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) return null;

  const jsonSlice = content.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSlice);
  } catch {
    return null; // invalid JSON
  }
}

// --- MAIN PROVIDER CLASS ---
export class OpenAIReceptionProvider implements ReceptionAssistantProvider {

  constructor(
    private readonly apiKey: string, // OpenAI API key
    private readonly model: string   // model name (e.g. gpt-4.1-mini)
  ) {}

  async generateReply(input: AssistantInput) {

    // --- FALLBACK EXTRACTION ---
    // Extract structured data (name, phone, etc.) from message using your own parser
    const fallbackDraftUpdates = extractLeadDraftUpdates(input.message);

    // --- CALL OPENAI API ---
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2, // low randomness → more consistent output

        messages: [
          // --- SYSTEM PROMPT (instructions) ---
          {
            role: "system",
            content:
              "You are an AI receptionist. Return strict JSON with keys: message (string), shouldEscalate (boolean), draftUpdates (object). Collect name, phone, and intent. Keep responses concise and polite.",
          },

          // Inject business FAQ context
          {
            role: "system",
            content: `Business FAQ script: ${input.faqScript}`,
          },

          // Inject current state of lead + missing fields
          {
            role: "system",
            content: `Current lead draft: ${JSON.stringify(input.draft)}; Missing fields: ${input.missingFields.join(", ") || "none"}; In business hours: ${input.inBusinessHours}`,
          },

          // --- CHAT HISTORY ---
          ...input.history.map((entry) => ({
            role: entry.role,
            content: entry.content,
          })),

          // --- CURRENT USER MESSAGE ---
          {
            role: "user",
            content: input.message,
          },
        ],
      }),
    });

    // --- ERROR HANDLING ---
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `OpenAI request failed with status ${response.status}: ${responseText}`
      );
    }

    // --- PARSE RESPONSE ---
    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;

    // Extract structured JSON from response
    const parsed = parseJsonResponse(content);

    // Ensure required field exists
    if (!parsed?.message) {
      throw new Error("OpenAI response missing required assistant message");
    }

    // --- FINAL OUTPUT ---
    return {
      message: parsed.message, // what user sees

      // fallback to false if missing
      shouldEscalate: parsed?.shouldEscalate ?? false,

      // Merge:
      // 1. fallback parser (regex/extraction)
      // 2. AI output
      draftUpdates: {
        ...fallbackDraftUpdates,
        ...(parsed?.draftUpdates ?? {}),
      },
    };
  }
}
