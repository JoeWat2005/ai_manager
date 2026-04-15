import { getEffectivePlan } from "@/lib/billing/effective-plan";
import { prisma } from "@/lib/prisma";
import { badRequest, ok } from "../clerk/responses";
import { ClerkSubscriptionEventData } from "../clerk/types";
import { getSubscriptionOrgId, toDate } from "../clerk/utils";

export async function handleSubscriptionUpsert(
  eventType: string,
  sub: ClerkSubscriptionEventData
): Promise<Response> {
  const clerkOrgId = getSubscriptionOrgId(sub);

  if (!clerkOrgId) {
    return badRequest(eventType, "Subscription missing payer organization id", {
      subscription: sub,
    });
  }

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  if (!organization) {
    return ok(
      eventType,
      "Subscription skipped because organization is not synced yet",
      {
        clerkOrgId,
        clerkSubscriptionId: sub.id,
      }
    );
  }

  const incomingItems = sub.items ?? [];
  for (const item of incomingItems) {
    if (!item.id) {
      return badRequest(eventType, "Subscription item missing id", {
        clerkOrgId,
        clerkSubscriptionId: sub.id,
        item,
      });
    }
  }

  const normalizedItems = incomingItems.map((item) => ({
    clerkSubscriptionItemId: item.id as string,
    plan: item.plan?.slug ?? item.plan?.name ?? "free",
    status: item.status ?? "unknown",
    periodStart: toDate(item.period_start),
    periodEnd: toDate(item.period_end),
  }));

  const result = await prisma.$transaction(async (tx) => {
    const savedSubscription = await tx.subscription.upsert({
      where: { clerkSubscriptionId: sub.id },
      update: {
        organizationId: organization.id,
        status: sub.status ?? "inactive",
      },
      create: {
        organizationId: organization.id,
        clerkSubscriptionId: sub.id,
        status: sub.status ?? "inactive",
      },
    });

    for (const item of normalizedItems) {
      await tx.subscriptionItem.upsert({
        where: { clerkSubscriptionItemId: item.clerkSubscriptionItemId },
        update: {
          subscriptionId: savedSubscription.id,
          plan: item.plan,
          status: item.status,
          periodStart: item.periodStart,
          periodEnd: item.periodEnd,
        },
        create: {
          subscriptionId: savedSubscription.id,
          clerkSubscriptionItemId: item.clerkSubscriptionItemId,
          plan: item.plan,
          status: item.status,
          periodStart: item.periodStart,
          periodEnd: item.periodEnd,
        },
      });
    }

    if (normalizedItems.length === 0) {
      await tx.subscriptionItem.deleteMany({
        where: { subscriptionId: savedSubscription.id },
      });
    } else {
      await tx.subscriptionItem.deleteMany({
        where: {
          subscriptionId: savedSubscription.id,
          clerkSubscriptionItemId: {
            notIn: normalizedItems.map((item) => item.clerkSubscriptionItemId),
          },
        },
      });
    }

    const savedItems = await tx.subscriptionItem.findMany({
      where: { subscriptionId: savedSubscription.id },
      orderBy: [{ periodStart: "asc" }, { id: "asc" }],
    });

    return { savedSubscription, savedItems };
  });

  const effectivePlan = getEffectivePlan(
    result.savedItems.map((item) => ({
      plan: item.plan,
      status: item.status,
      periodEnd: item.periodEnd,
    }))
  );

  return ok(eventType, "Subscription timeline synced", {
    subscriptionId: result.savedSubscription.id,
    clerkSubscriptionId: result.savedSubscription.clerkSubscriptionId,
    clerkOrgId,
    status: result.savedSubscription.status,
    itemCount: result.savedItems.length,
    effectivePlan,
  });
}
