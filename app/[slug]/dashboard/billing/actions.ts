"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function cancelSubscription(slug: string): Promise<{ error?: string }> {
  const { orgId } = await auth();
  if (!orgId) return { error: "Not authorized" };

  try {
    const org = await prisma.organization.findFirst({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });
    if (!org) return { error: "Organization not found" };

    const sub = await prisma.subscription.findUnique({
      where: { organizationId: org.id },
      select: { clerkSubscriptionId: true },
    });
    if (!sub) return { error: "No active subscription found" };

    const clerk = await clerkClient();
    // Clerk Commerce: cancel subscription via backend API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionsApi = (clerk as Record<string, any>).subscriptions;
    if (typeof subscriptionsApi?.cancelSubscription !== "function") {
      return {
        error:
          "Automated cancellation is not configured. Please contact support to cancel your subscription.",
      };
    }

    await subscriptionsApi.cancelSubscription({
      subscriptionId: sub.clerkSubscriptionId,
    });

    revalidatePath(`/${slug}/dashboard/billing`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Cancellation failed" };
  }
}
