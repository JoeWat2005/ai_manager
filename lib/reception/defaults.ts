import { BusinessHours, LeadDraft } from "./types";

// --- DEFAULT TIMEZONE ---
// Used when no timezone is configured for an organization
export const DEFAULT_RECEPTION_TIMEZONE = "Europe/London";

// --- DEFAULT BUSINESS HOURS ---
// Fallback schedule used when org has no custom hours
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },

  // Weekends disabled by default
  saturday: { enabled: false, start: "09:00", end: "12:00" },
  sunday: { enabled: false, start: "09:00", end: "12:00" },
};

// --- EMPTY LEAD TEMPLATE ---
// Initial state for collecting user info during chat
export const EMPTY_LEAD_DRAFT: LeadDraft = {
  name: null,                    // customer's name
  phone: null,                   // phone number
  intent: null,                  // what they want (e.g. booking, inquiry)
  preferredCallbackWindow: null, // preferred callback time
  callbackReason: null,          // reason for callback
};

// --- GET DEFAULT TIMEZONE ---
// Uses env override if available, otherwise fallback
export function getDefaultTimezone(): string {
  return process.env.RECEPTION_DEFAULT_TIMEZONE ?? DEFAULT_RECEPTION_TIMEZONE;
}