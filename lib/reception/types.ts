export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

export type BusinessHours = Record<Weekday, DaySchedule>;

export type LeadDraft = {
  name: string | null;
  phone: string | null;
  intent: string | null;
  preferredCallbackWindow: string | null;
  callbackReason: string | null;
};

export type AssistantReply = {
  message: string;
  draftUpdates: Partial<LeadDraft>;
  shouldEscalate: boolean;
};

export type ChatTurnResult = {
  assistantMessage: string;
  leadCaptureState: "collecting" | "qualified" | "not-qualified";
  nextFieldsNeeded: string[];
  draft: LeadDraft;
  qualified: boolean;
};
