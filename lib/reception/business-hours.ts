import { DEFAULT_BUSINESS_HOURS } from "./defaults";
import { BusinessHours, Weekday } from "./types";

// List of valid weekdays (used for validation)
const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// --- HELPER: Convert "HH:MM" → minutes since midnight ---
function parseTimeToMinutes(value: string): number | null {

  // Ensure correct format (e.g. "09:30")
  if (!/^\d{2}:\d{2}$/.test(value)) return null;

  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  // Validate ranges
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

// --- NORMALIZE INPUT (very important) ---
export function normalizeBusinessHours(value: unknown): BusinessHours {

  // If invalid input → return defaults
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_BUSINESS_HOURS };
  }

  const parsed = value as Partial<BusinessHours>;

  // Start from defaults
  const result = { ...DEFAULT_BUSINESS_HOURS };

  // Loop through each day
  for (const day of Object.keys(result) as Weekday[]) {
    const candidate = parsed[day];

    // Skip invalid entries
    if (!candidate || typeof candidate !== "object") continue;

    // Validate "enabled"
    const enabled =
      typeof candidate.enabled === "boolean"
        ? candidate.enabled
        : result[day].enabled;

    // Validate "start" time
    const start =
      typeof candidate.start === "string" &&
      parseTimeToMinutes(candidate.start) !== null
        ? candidate.start
        : result[day].start;

    // Validate "end" time
    const end =
      typeof candidate.end === "string" &&
      parseTimeToMinutes(candidate.end) !== null
        ? candidate.end
        : result[day].end;

    // Save validated values
    result[day] = { enabled, start, end };
  }

  return result;
}

// --- CHECK IF CURRENT TIME IS WITHIN BUSINESS HOURS ---
export function isWithinBusinessHours(
  businessHours: BusinessHours,
  timezone: string,
  date: Date = new Date()
): boolean {

  // Format date in the given timezone
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour12: false,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  // Extract weekday, hour, minute
  const dayPart = parts.find((part) => part.type === "weekday")?.value.toLowerCase();

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  const minutes = hour * 60 + minute;

  const weekday = dayPart as Weekday | undefined;

  // Invalid weekday → closed
  if (!weekday || !WEEKDAYS.includes(weekday)) return false;

  const schedule = businessHours[weekday];

  // If day is disabled → closed
  if (!schedule?.enabled) return false;

  // Convert opening/closing times
  const start = parseTimeToMinutes(schedule.start);
  const end = parseTimeToMinutes(schedule.end);

  if (start === null || end === null) return false;

  // Check if current time is within range
  return minutes >= start && minutes <= end;
}