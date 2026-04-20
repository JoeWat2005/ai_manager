import { extractLeadDraftUpdates } from "../parsing";
import { AssistantInput, ReceptionAssistantProvider } from "./types";

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function parseJsonResponse(content: string | null | undefined): {
  message?: string;
  shouldEscalate?: boolean;
  draftUpdates?: Record<string, string>;
} | null {
  if (!content) return null;
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;
  const jsonSlice = content.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonSlice) as {
      message?: string;
      shouldEscalate?: boolean;
      draftUpdates?: Record<string, string>;
    };
  } catch {
    return null;
  }
}

export class OpenAIReceptionProvider implements ReceptionAssistantProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generateReply(input: AssistantInput) {
    const fallbackDraftUpdates = extractLeadDraftUpdates(input.message);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an AI receptionist. Return strict JSON with keys: message (string), shouldEscalate (boolean), draftUpdates (object). Collect name, phone, and intent. Keep responses concise and polite.",
          },
          {
            role: "system",
            content: `Business FAQ script: ${input.faqScript}`,
          },
          {
            role: "system",
            content: `Current lead draft: ${JSON.stringify(input.draft)}; Missing fields: ${input.missingFields.join(", ") || "none"}; In business hours: ${input.inBusinessHours}`,
          },
          ...input.history.map((entry) => ({
            role: entry.role,
            content: entry.content,
          })),
          {
            role: "user",
            content: input.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `OpenAI request failed with status ${response.status}: ${responseText}`
      );
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    const parsed = parseJsonResponse(content);

    if (!parsed?.message) {
      throw new Error("OpenAI response missing required assistant message");
    }

    return {
      message: parsed.message,
      shouldEscalate: parsed?.shouldEscalate ?? false,
      draftUpdates: {
        ...fallbackDraftUpdates,
        ...(parsed?.draftUpdates ?? {}),
      },
    };
  }
}
