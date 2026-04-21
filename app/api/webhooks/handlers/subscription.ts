// Import helper that determines the organization's effective plan
// based on subscription items and their statuses/timing
import { getEffectivePlan } from "@/lib/billing/effective-plan";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Import standard webhook response helpers
import { badRequest, ok } from "../clerk/responses";

// Import the expected shape of Clerk subscription webhook payloads
import { ClerkSubscriptionEventData } from "../clerk/types";

// Import helper functions for subscription webhook data
import { getSubscriptionOrgId, toDate } from "../clerk/utils";

// Handle subscription created/updated/active/pastDue events
export async function handleSubscriptionUpsert(
  eventType: string,
  sub: ClerkSubscriptionEventData
): Promise<Response> {
  // Extract the Clerk organization ID responsible for the subscription
  const clerkOrgId = getSubscriptionOrgId(sub);

  // If we can't figure out which org this subscription belongs to, fail
  if (!clerkOrgId) {
    return badRequest(eventType, "Subscription missing payer organization id", {
      subscription: sub,
    });
  }

  // Find the local organization row using Clerk org ID
  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  // If the org hasn't been synced locally yet, skip gracefully
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

  // Normalize incoming subscription items
  const incomingItems = sub.items ?? [];

  // Validate that every item has an ID
  for (const item of incomingItems) {
    if (!item.id) {
      return badRequest(eventType, "Subscription item missing id", {
        clerkOrgId,
        clerkSubscriptionId: sub.id,
        item,
      });
    }
  }

  // Convert Clerk item data into a clean shape for local DB storage
  const normalizedItems = incomingItems.map((item) => ({
    clerkSubscriptionItemId: item.id as string,

    // Use plan slug if available, otherwise plan name, otherwise "free"
    plan: item.plan?.slug ?? item.plan?.name ?? "free",

    // Default unknown status if missing
    status: item.status ?? "unknown",

    // Convert date/timestamp fields into Date objects (or null)
    periodStart: toDate(item.period_start),
    periodEnd: toDate(item.period_end),
  }));

  // Perform subscription + item sync inside a DB transaction
  const result = await prisma.$transaction(async (tx) => {
    // Upsert the parent subscription row
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

    // Upsert each subscription item
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

    // Remove local items that no longer exist in Clerk
    if (normalizedItems.length === 0) {
      // If Clerk says there are no items, remove all local items for this subscription
      await tx.subscriptionItem.deleteMany({
        where: { subscriptionId: savedSubscription.id },
      });
    } else {
      // Otherwise, delete only items that are no longer present
      await tx.subscriptionItem.deleteMany({
        where: {
          subscriptionId: savedSubscription.id,
          clerkSubscriptionItemId: {
            notIn: normalizedItems.map((item) => item.clerkSubscriptionItemId),
          },
        },
      });
    }

    // Fetch the final saved items after sync
    const savedItems = await tx.subscriptionItem.findMany({
      where: { subscriptionId: savedSubscription.id },
      orderBy: [{ periodStart: "asc" }, { id: "asc" }],
    });

    // Return both subscription row and synced items
    return { savedSubscription, savedItems };
  });

  // Compute the effective/current plan from saved item timeline
  const effectivePlan = getEffectivePlan(
    result.savedItems.map((item) => ({
      plan: item.plan,
      status: item.status,
      periodEnd: item.periodEnd,
    }))
  );

  // Return success response with sync summary
  return ok(eventType, "Subscription timeline synced", {
    subscriptionId: result.savedSubscription.id,
    clerkSubscriptionId: result.savedSubscription.clerkSubscriptionId,
    clerkOrgId,
    status: result.savedSubscription.status,
    itemCount: result.savedItems.length,
    effectivePlan,
  });
}
