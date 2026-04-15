type PlanTimelineItem = {
  plan: string;
  status: string;
  periodEnd: Date | null;
};

function isStatus(item: PlanTimelineItem, status: string): boolean {
  const normalized = item.status.toLowerCase();
  if (status === "canceled") {
    return normalized === "canceled" || normalized === "cancelled";
  }
  return normalized === status;
}

export function getEffectivePlanItem(
  items: PlanTimelineItem[],
  now: Date = new Date()
): PlanTimelineItem | null {
  if (items.length === 0) {
    return null;
  }

  const activeItem = items.find((item) => isStatus(item, "active"));
  if (activeItem) {
    return activeItem;
  }

  const canceledFutureItem = items.find(
    (item) =>
      isStatus(item, "canceled") &&
      item.periodEnd !== null &&
      item.periodEnd.getTime() > now.getTime()
  );
  if (canceledFutureItem) {
    return canceledFutureItem;
  }

  const upcomingItem = items.find((item) => isStatus(item, "upcoming"));
  if (upcomingItem) {
    return upcomingItem;
  }

  return items[0];
}

export function getEffectivePlan(
  items: PlanTimelineItem[],
  now: Date = new Date()
): string {
  return getEffectivePlanItem(items, now)?.plan ?? "free";
}

export function isPaidPlan(plan: string): boolean {
  const normalized = plan.toLowerCase();
  return !normalized.includes("free");
}
