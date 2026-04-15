import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getEffectivePlan, isPaidPlan } from "@/lib/billing/effective-plan";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { orgId } = await auth();
  const { slug } = await params;

  const timelineItems = orgId
    ? await prisma.subscriptionItem.findMany({
        where: {
          subscription: {
            organization: {
              clerkOrgId: orgId,
            },
          },
        },
        select: {
          plan: true,
          status: true,
          periodEnd: true,
        },
        orderBy: [{ periodStart: "asc" }, { id: "asc" }],
      })
    : [];

  const effectivePlan = getEffectivePlan(timelineItems);
  const hasPaidPlan = isPaidPlan(effectivePlan);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard for {slug}</h1>

      <section className="rounded-xl border p-4">
        <p className="text-sm opacity-80">Current effective plan: {effectivePlan}</p>
      </section>

      {!hasPaidPlan && (
        <section className="space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
            <p className="text-sm opacity-80">
              You are on the free plan. Upgrade to unlock full access.
            </p>
          </div>

          <PricingTable
            for="organization"
            newSubscriptionRedirectUrl={`/${slug}/dashboard`}
          />
        </section>
      )}

      {hasPaidPlan ? (
        <section className="rounded-xl border p-6">
          <p>Pro dashboard content goes here.</p>
        </section>
      ) : (
        <section className="rounded-xl border p-6">
          <p>Free dashboard content goes here.</p>
        </section>
      )}
    </main>
  );
}
