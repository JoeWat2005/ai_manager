import { ClerkSubscriptionEventData } from "./types";

/**
 * Convert various date formats into a proper JavaScript Date object.
 * Clerk can send timestamps as:
 * - seconds (e.g. 1690000000)
 * - milliseconds (e.g. 1690000000000)
 * - ISO strings (e.g. "2024-01-01T00:00:00Z")
 */
export function toDate(value: number | string | null | undefined): Date | null {
  // If value is null or undefined → return null
  if (value == null) return null;

  // If it's a number (timestamp)
  if (typeof value === "number") {
    // If it's large, assume milliseconds
    // If small, assume seconds → convert to milliseconds
    return value > 9999999999
      ? new Date(value)
      : new Date(value * 1000);
  }

  // If it's a string → try parsing as date
  const date = new Date(value);

  // If invalid date → return null
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Extract organization ID from a Clerk subscription event
 */
export function getSubscriptionOrgId(
  sub: ClerkSubscriptionEventData
): string | null {
  // Safely access nested payer.organization_id
  return sub.payer?.organization_id ?? null;
}