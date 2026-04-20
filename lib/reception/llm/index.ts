import { OpenAIReceptionProvider } from "./openai-provider";
import { ReceptionAssistantProvider } from "./types";

export function getReceptionAssistantProvider(): ReceptionAssistantProvider {
  const provider = process.env.RECEPTION_LLM_PROVIDER?.toLowerCase() ?? "openai";
  if (provider !== "openai") {
    throw new Error(
      `Unsupported RECEPTION_LLM_PROVIDER "${provider}". Web chat currently requires OpenAI.`
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for receptionist web chat");
  }

  return new OpenAIReceptionProvider(
    apiKey,
    process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
  );
}
