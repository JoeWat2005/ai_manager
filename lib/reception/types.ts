// --- DAYS OF THE WEEK ---
// Strict union type so you can't pass invalid values like "mon" or "friyay"
export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";


// --- SINGLE DAY SCHEDULE ---
// Defines working hours for one day
export type DaySchedule = {
  enabled: boolean; // Is business open that day?
  start: string;    // e.g. "09:00"
  end: string;      // e.g. "17:00"
};


// --- FULL WEEK SCHEDULE ---
// Maps each weekday → its schedule
export type BusinessHours = Record<Weekday, DaySchedule>;


// --- LEAD DATA BEING COLLECTED ---
// This is what your AI/chat is trying to fill in
export type LeadDraft = {
  name: string | null;
  phone: string | null;
  intent: string | null;
  preferredCallbackWindow: string | null;
  callbackReason: string | null;
};


// --- AI / ASSISTANT RESPONSE STRUCTURE ---
// What your AI (or rule-based system) must return
export type AssistantReply = {
  message: string;                        // What user sees
  draftUpdates: Partial<LeadDraft>;       // Extracted info (name, phone, etc.)
  shouldEscalate: boolean;                // Should human step in?
};


// --- RESULT OF A CHAT TURN ---
// Final structured output after processing a message
export type ChatTurnResult = {
  assistantMessage: string;               // Final message sent to user
  leadCaptureState: "collecting" | "qualified" | "not-qualified";
  nextFieldsNeeded: string[];             // Missing info (e.g. ["phone"])
  draft: LeadDraft;                       // Current state of collected data
  qualified: boolean;                     // Is lead complete?
};
