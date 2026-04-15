import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { has } = await auth();
  const { slug } = await params;

  const hasFull = has({ feature: "full" });
  const hasLimited = has({ feature: "limited" });

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard for {slug}</h1>

      {!hasFull && hasLimited && (
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

      {hasFull ? (
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
