// app/[slug]/dashboard/page.tsx
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { PricingTable } from "@clerk/nextjs";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId, orgId, has } = await auth();
  const { slug } = await params;

  if (!userId || !orgId) {
    redirect("/sign-in");
  }

  const client = await clerkClient();
  const org = await client.organizations.getOrganization({
    organizationId: orgId,
  });

  if (org.slug !== slug) {
    notFound();
  }

  const hasFull = has({ feature: "full" });
  const hasLimited = has({ feature: "limited" });

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard for {slug}</h1>

      {!hasFull && hasLimited && (
        <section className="rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Upgrade to Pro</h2>
            <p className="text-sm opacity-80">
              You’re on the free plan. Upgrade to unlock full access.
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