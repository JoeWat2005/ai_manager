// Represents one subscription item in a timeline
type PlanTimelineItem = {
  plan: string;           // e.g. "pro", "free", "starter"
  status: string;         // e.g. "active", "canceled", "upcoming"
  periodEnd: Date | null; // when this plan ends (if applicable)
};

// Helper to safely compare statuses (handles spelling differences)
function isStatus(item: PlanTimelineItem, status: string): boolean {
  const normalized = item.status.toLowerCase();

  // Special case: "canceled" vs "cancelled"
  if (status === "canceled") {
    return normalized === "canceled" || normalized === "cancelled";
  }

  return normalized === status;
}

// Determines which plan item should be considered "active"
export function getEffectivePlanItem(
  items: PlanTimelineItem[],
  now: Date = new Date()
): PlanTimelineItem | null {

  // No items → no plan
  if (items.length === 0) {
    return null;
  }

  // 1. Highest priority: active plan
  const activeItem = items.find((item) => isStatus(item, "active"));
  if (activeItem) {
    return activeItem;
  }

  // 2. Next: canceled but still valid (not expired yet)
  const canceledFutureItem = items.find(
    (item) =>
      isStatus(item, "canceled") &&
      item.periodEnd !== null &&
      item.periodEnd.getTime() > now.getTime()
  );
  if (canceledFutureItem) {
    return canceledFutureItem;
  }

  // 3. Next: upcoming plan
  const upcomingItem = items.find((item) => isStatus(item, "upcoming"));
  if (upcomingItem) {
    return upcomingItem;
  }

  // 4. Fallback: just return the first item
  return items[0];
}

// Returns just the plan name (string) instead of the full item
export function getEffectivePlan(
  items: PlanTimelineItem[],
  now: Date = new Date()
): string {
  return getEffectivePlanItem(items, now)?.plan ?? "free";
}

// Determines if a plan is considered "paid"
export function isPaidPlan(plan: string): boolean {
  const normalized = plan.toLowerCase();

  // Anything that includes "free" is NOT paid
  return !normalized.includes("free");
}
