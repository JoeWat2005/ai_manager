import { OpenAIReceptionProvider } from "./openai-provider";
import { ReceptionAssistantProvider } from "./types";

// Factory function: returns the AI provider your app should use
export function getReceptionAssistantProvider(): ReceptionAssistantProvider {

  // Read provider from environment variable
  // Defaults to "openai" if not set
  const provider =
    process.env.RECEPTION_LLM_PROVIDER?.toLowerCase() ?? "openai";

  // --- VALIDATE PROVIDER ---
  // Only OpenAI is supported right now
  if (provider !== "openai") {
    throw new Error(
      `Unsupported RECEPTION_LLM_PROVIDER "${provider}". Web chat currently requires OpenAI.`
    );
  }

  // --- CHECK API KEY ---
  // Ensure OpenAI API key exists
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for receptionist web chat");
  }

  // --- CREATE PROVIDER INSTANCE ---
  // Return a configured OpenAI provider
  return new OpenAIReceptionProvider(
    apiKey,
    process.env.OPENAI_MODEL ?? "gpt-4.1-mini" // default model
  );
}