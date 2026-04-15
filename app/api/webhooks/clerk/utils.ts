import { ClerkSubscriptionEventData } from "./types";

export function toDate(value: number | string | null | undefined): Date | null {
  if (value == null) return null;

  if (typeof value === "number") {
    return value > 9999999999 ? new Date(value) : new Date(value * 1000);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getSubscriptionOrgId(
  sub: ClerkSubscriptionEventData
): string | null {
  return sub.payer?.organization_id ?? null;
}
