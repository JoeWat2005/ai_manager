import { LeadDraft } from "./types";

// Regex to detect phone numbers (very flexible format)
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;

// Extract structured lead data from a free-text message
export function extractLeadDraftUpdates(message: string): Partial<LeadDraft> {
  const updates: Partial<LeadDraft> = {};

  // Trim whitespace
  const trimmed = message.trim();

  // If message is empty → nothing to extract
  if (!trimmed) return updates;

  // --- PHONE EXTRACTION ---
  const phoneMatch = trimmed.match(PHONE_REGEX);
  if (phoneMatch?.[0]) {
    updates.phone = phoneMatch[0];
  }

  // --- NAME EXTRACTION ---
  // Looks for patterns like:
  // "my name is John"
  // "I am Sarah"
  // "this is Mike"
  const nameMatch = trimmed.match(
    /(?:my name is|i am|this is)\s+([a-z][a-z\s'-]{1,50})/i
  );
  if (nameMatch?.[1]) {
    updates.name = nameMatch[1].trim();
  }

  // --- CALLBACK TIME EXTRACTION ---
  // Examples:
  // "call me at 3pm"
  // "call back around 10:30"
  // "callback between 2-4"
  const callbackWindowMatch = trimmed.match(
    /(?:call me|callback|call back)\s+(?:at|around|between)?\s*([a-z0-9:\s\-]+)$/i
  );
  if (callbackWindowMatch?.[1]) {
    updates.preferredCallbackWindow = callbackWindowMatch[1].trim();
  }

  // --- INTENT DETECTION ---
  // Basic keyword detection for what the user wants
  const intentKeywords = [
    "book",
    "appointment",
    "quote",
    "pricing",
    "consultation",
    "repair",
    "support",
    "question",
    "availability",
  ];

  const maybeIntent = intentKeywords.some((keyword) =>
    trimmed.toLowerCase().includes(keyword)
  );

  // If keywords found and intent not already set → use full message
  if (maybeIntent && !updates.intent) {
    updates.intent = trimmed;
  }

  return updates;
}
