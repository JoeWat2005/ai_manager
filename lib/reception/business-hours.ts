import { DEFAULT_BUSINESS_HOURS } from "./defaults";
import { BusinessHours, Weekday } from "./types";

const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function parseTimeToMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
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

export function normalizeBusinessHours(value: unknown): BusinessHours {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_BUSINESS_HOURS };
  }

  const parsed = value as Partial<BusinessHours>;
  const result = { ...DEFAULT_BUSINESS_HOURS };

  for (const day of Object.keys(result) as Weekday[]) {
    const candidate = parsed[day];
    if (!candidate || typeof candidate !== "object") continue;

    const enabled =
      typeof candidate.enabled === "boolean"
        ? candidate.enabled
        : result[day].enabled;
    const start =
      typeof candidate.start === "string" && parseTimeToMinutes(candidate.start) !== null
        ? candidate.start
        : result[day].start;
    const end =
      typeof candidate.end === "string" && parseTimeToMinutes(candidate.end) !== null
        ? candidate.end
        : result[day].end;

    result[day] = { enabled, start, end };
  }

  return result;
}

export function isWithinBusinessHours(
  businessHours: BusinessHours,
  timezone: string,
  date: Date = new Date()
): boolean {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour12: false,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const dayPart = parts.find((part) => part.type === "weekday")?.value.toLowerCase();
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const minutes = hour * 60 + minute;

  const weekday = dayPart as Weekday | undefined;
  if (!weekday || !WEEKDAYS.includes(weekday)) return false;

  const schedule = businessHours[weekday];
  if (!schedule?.enabled) return false;

  const start = parseTimeToMinutes(schedule.start);
  const end = parseTimeToMinutes(schedule.end);
  if (start === null || end === null) return false;

  return minutes >= start && minutes <= end;
}
