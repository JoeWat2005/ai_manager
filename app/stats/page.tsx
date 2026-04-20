import Link from "next/link";
import { OrganizationSnapshotTable } from "@/components/dashboard/OrganizationSnapshotTable";
import { getEffectivePlan, isPaidPlan } from "@/lib/billing/effective-plan";
import { prisma } from "@/lib/prisma";

export default async function StatsPage() {
  const [userCount, orgCount, membershipCount, subscriptions, organizations] =
    await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.organizationMembership.count(),
      prisma.subscription.findMany({
        select: {
          organizationId: true,
          items: {
            select: {
              plan: true,
              status: true,
              periodEnd: true,
            },
            orderBy: [{ periodStart: "asc" }, { id: "asc" }],
          },
        },
      }),
      prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { memberships: true },
          },
          subscription: {
            select: {
              items: {
                select: {
                  plan: true,
                  status: true,
                  periodEnd: true,
                },
                orderBy: [{ periodStart: "asc" }, { id: "asc" }],
              },
            },
          },
        },
        orderBy: { name: "asc" },
        take: 12,
      }),
    ]);

  const proOrganizationIds = new Set(
    subscriptions
      .filter((subscription) => isPaidPlan(getEffectivePlan(subscription.items)))
      .map((subscription) => subscription.organizationId)
  );

  const proOrgCount = proOrganizationIds.size;
  const freeOrgCount = Math.max(orgCount - proOrgCount, 0);
  const averageMembershipsPerOrg =
    orgCount > 0 ? (membershipCount / orgCount).toFixed(1) : "0.0";
  const organizationRows = organizations.map((organization) => {
    const effectivePlan = getEffectivePlan(organization.subscription?.items ?? []);
    const paid = isPaidPlan(effectivePlan);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      members: organization._count.memberships,
      effectivePlan,
      paid,
    };
  });

  return (
    <div data-theme="light" className="min-h-screen bg-base-200/50">
      <main className="app-shell space-y-8 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide uppercase text-primary">
              Deskcaptain Stats
            </p>
            <h1 className="text-4xl font-black tracking-tight">Live signup and usage totals</h1>
            <p className="mt-2 max-w-2xl text-base-content/70">
              Current snapshot pulled from your database. This page intentionally
              shows real totals only.
            </p>
          </div>
          <Link href="/" className="btn btn-outline btn-primary">
            Back to Landing
          </Link>
        </header>

        <section className="stats stats-vertical w-full border border-base-300 bg-base-100 shadow sm:stats-horizontal">
          <div className="stat">
            <div className="stat-title">Total Signups (Users)</div>
            <div className="stat-value text-primary">{userCount}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Organizations</div>
            <div className="stat-value">{orgCount}</div>
            <div className="stat-desc">{freeOrgCount} free / {proOrgCount} paid-effective</div>
          </div>
          <div className="stat">
            <div className="stat-title">Memberships</div>
            <div className="stat-value">{membershipCount}</div>
            <div className="stat-desc">
              Avg {averageMembershipsPerOrg} memberships per organization
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-base">Paid-effective organizations</h2>
              <p className="text-sm text-base-content/70">
                Organizations whose effective subscription plan is currently paid.
              </p>
              <p className="text-3xl font-extrabold text-accent">{proOrgCount}</p>
            </div>
          </article>
          <article className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-base">Free-effective organizations</h2>
              <p className="text-sm text-base-content/70">
                Organizations currently on effective free status.
              </p>
              <p className="text-3xl font-extrabold text-primary">{freeOrgCount}</p>
            </div>
          </article>
          <article className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-base">Tracked subscriptions</h2>
              <p className="text-sm text-base-content/70">
                Subscription containers currently synced from Clerk.
              </p>
              <p className="text-3xl font-extrabold">{subscriptions.length}</p>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Organization snapshot</h2>
            <p className="text-sm text-base-content/70">
              First 12 organizations, including current effective plan and member counts.
            </p>
          </div>
          <OrganizationSnapshotTable organizations={organizationRows} />
        </section>
      </main>
    </div>
  );
}
