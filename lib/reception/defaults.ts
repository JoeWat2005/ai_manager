import { BusinessHours, LeadDraft } from "./types";

export const DEFAULT_RECEPTION_TIMEZONE = "Europe/London";

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "12:00" },
  sunday: { enabled: false, start: "09:00", end: "12:00" },
};

export const EMPTY_LEAD_DRAFT: LeadDraft = {
  name: null,
  phone: null,
  intent: null,
  preferredCallbackWindow: null,
  callbackReason: null,
};

export function getDefaultTimezone(): string {
  return process.env.RECEPTION_DEFAULT_TIMEZONE ?? DEFAULT_RECEPTION_TIMEZONE;
}
