import { prisma } from "@/lib/prisma";
import { badRequest, ok } from "../responses";
import { ClerkSubscriptionEventData } from "../types";
import { getSubscriptionOrgId, toDate } from "../utils";

export async function handleSubscriptionUpsert(
  eventType: string,
  sub: ClerkSubscriptionEventData
): Promise<Response> {
  const clerkOrgId = getSubscriptionOrgId(sub);

  if (!clerkOrgId) {
    return badRequest(eventType, "Subscription missing organization id", {
      subscription: sub,
    });
  }

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  if (!organization) {
    return badRequest(eventType, "Organization not found for subscription", {
      clerkOrgId,
      subscriptionId: sub.id,
    });
  }

  const savedSubscription = await prisma.subscription.upsert({
    where: {
      organizationId: organization.id,
    },
    update: {
      plan: sub.plan_name ?? "free",
      status: sub.status ?? "inactive",
      billingProvider: "clerk",
      billingCustomerId: sub.customer_id ?? null,
      billingSubscriptionId: sub.id ?? null,
      priceId: sub.price_id ?? null,
      currentPeriodStart: toDate(sub.current_period_start),
      currentPeriodEnd: toDate(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
    create: {
      organizationId: organization.id,
      plan: sub.plan_name ?? "free",
      status: sub.status ?? "inactive",
      billingProvider: "clerk",
      billingCustomerId: sub.customer_id ?? null,
      billingSubscriptionId: sub.id ?? null,
      priceId: sub.price_id ?? null,
      currentPeriodStart: toDate(sub.current_period_start),
      currentPeriodEnd: toDate(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  });

  return ok(eventType, "Subscription synced", {
    subscriptionId: savedSubscription.id,
    clerkSubscriptionId: sub.id,
    clerkOrgId,
    status: savedSubscription.status,
    plan: savedSubscription.plan,
  });
}