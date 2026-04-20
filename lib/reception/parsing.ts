import { LeadDraft } from "./types";

const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;

export function extractLeadDraftUpdates(message: string): Partial<LeadDraft> {
  const updates: Partial<LeadDraft> = {};
  const trimmed = message.trim();
  if (!trimmed) return updates;

  const phoneMatch = trimmed.match(PHONE_REGEX);
  if (phoneMatch?.[0]) {
    updates.phone = phoneMatch[0];
  }

  const nameMatch = trimmed.match(/(?:my name is|i am|this is)\s+([a-z][a-z\s'-]{1,50})/i);
  if (nameMatch?.[1]) {
    updates.name = nameMatch[1].trim();
  }

  const callbackWindowMatch = trimmed.match(
    /(?:call me|callback|call back)\s+(?:at|around|between)?\s*([a-z0-9:\s\-]+)$/i
  );
  if (callbackWindowMatch?.[1]) {
    updates.preferredCallbackWindow = callbackWindowMatch[1].trim();
  }

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
  if (maybeIntent && !updates.intent) {
    updates.intent = trimmed;
  }

  return updates;
}
