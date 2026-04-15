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
    return badRequest(eventType, "Subscription missing organization id", {
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
      subscriptionId: sub.id,
      }
    );
  }

  const activeItem =
    sub.items?.find((item) => item.status === "active") ??
    sub.items?.[0] ??
    null;

  const plan =
    activeItem?.plan?.slug ??
    activeItem?.plan?.name ??
    sub.plan_name ??
    "free";

  const currentPeriodEnd =
    toDate(activeItem?.period_end) ?? toDate(sub.current_period_end);

  const savedSubscription = await prisma.subscription.upsert({
    where: {
      organizationId: organization.id,
    },
    update: {
      plan,
      status: sub.status ?? "inactive",
      billingSubscriptionId: sub.id ?? null,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
    create: {
      organizationId: organization.id,
      plan,
      status: sub.status ?? "inactive",
      billingSubscriptionId: sub.id ?? null,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  });

  return ok(eventType, "Subscription synced", {
    subscriptionId: savedSubscription.id,
    clerkSubscriptionId: sub.id,
    clerkOrgId,
    status: savedSubscription.status,
    plan: savedSubscription.plan,
    billingSubscriptionId: savedSubscription.billingSubscriptionId,
    currentPeriodEnd: savedSubscription.currentPeriodEnd,
    cancelAtPeriodEnd: savedSubscription.cancelAtPeriodEnd,
  });
}
