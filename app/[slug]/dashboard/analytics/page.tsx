import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BookingsSourceDonutChart } from "@/components/dashboard/charts/BookingsSourceDonutChart";
import { BookingsVolumeChart } from "@/components/dashboard/charts/BookingsVolumeChart";
import { prisma } from "@/lib/prisma";
import { getOrganizationByClerkOrgId } from "@/lib/reception/org";

type DayPoint = {
  key: string;
  label: string;
  inbound: number;
  qualified: number;
};

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId, orgId } = await auth();
  const { slug } = await params;

  if (!userId || !orgId) {
    redirect("/sign-in");
  }

  const organization = await getOrganizationByClerkOrgId(orgId);
  if (!organization) {
    redirect("/onboarding");
  }

  if (organization.slug !== slug) {
    redirect(`/${organization.slug}/dashboard/analytics`);
  }

  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - 6);

  const [totalLeads, qualifiedLeads, contactedLeads, closedLeads, channelCounts, recentLeads] =
    await Promise.all([
      prisma.receptionLead.count({
        where: { organizationId: organization.id },
      }),
      prisma.receptionLead.count({
        where: { organizationId: organization.id, qualified: true },
      }),
      prisma.receptionLead.count({
        where: { organizationId: organization.id, status: "contacted" },
      }),
      prisma.receptionLead.count({
        where: { organizationId: organization.id, status: "closed" },
      }),
      prisma.receptionLead.groupBy({
        by: ["channel"],
        where: { organizationId: organization.id },
        _count: { _all: true },
      }),
      prisma.receptionLead.findMany({
        where: {
          organizationId: organization.id,
          createdAt: {
            gte: windowStart,
          },
        },
        select: {
          createdAt: true,
          qualified: true,
        },
      }),
    ]);

  const trendPoints: DayPoint[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    trendPoints.push({
      key: toDayKey(day),
      label: day.toLocaleDateString("en-GB", { weekday: "short" }),
      inbound: 0,
      qualified: 0,
    });
  }

  const dayLookup = new Map(trendPoints.map((point) => [point.key, point]));
  for (const lead of recentLeads) {
    const key = toDayKey(lead.createdAt);
    const point = dayLookup.get(key);
    if (!point) continue;

    point.inbound += 1;
    if (lead.qualified) {
      point.qualified += 1;
    }
  }

  const qualificationRate =
    totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const contactRate =
    qualifiedLeads > 0 ? Math.round((contactedLeads / qualifiedLeads) * 100) : 0;
  const closeRate = contactedLeads > 0 ? Math.round((closedLeads / contactedLeads) * 100) : 0;

  const channelSplit = channelCounts.map((item) => ({
    label: item.channel === "phone" ? "Phone" : "Web chat",
    value: item._count._all,
  }));

  if (channelSplit.length === 0) {
    channelSplit.push(
      { label: "Phone", value: 0 },
      { label: "Web chat", value: 0 }
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-base-100 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Analytics
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
          Reception performance insights
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Lead funnel and channel trends from your AI receptionist operation.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total leads</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{totalLeads}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Qualification rate</p>
          <p className="mt-2 text-3xl font-black text-primary">{qualificationRate}%</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Contact rate</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{contactRate}%</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Close rate</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{closeRate}%</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Inbound vs qualified (last 7 days)</h2>
          <p className="text-sm text-slate-500">Track top-of-funnel quality each day</p>
          <div className="mt-3">
            <BookingsVolumeChart
              labels={trendPoints.map((point) => point.label)}
              newBookings={trendPoints.map((point) => point.inbound)}
              completedBookings={trendPoints.map((point) => point.qualified)}
              newSeriesName="Inbound"
              completedSeriesName="Qualified"
            />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Channel split</h2>
          <p className="text-sm text-slate-500">Where inbound conversations start</p>
          <div className="mt-3">
            <BookingsSourceDonutChart items={channelSplit} totalLabel="Leads" />
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Funnel health</h2>
        <p className="text-sm text-slate-500">
          Keep these conversion stages moving with daily ops reviews.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Qualified from inbound</span>
              <span className="font-semibold">{qualificationRate}%</span>
            </div>
            <progress className="progress progress-primary w-full" value={qualificationRate} max={100} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Contacted from qualified</span>
              <span className="font-semibold">{contactRate}%</span>
            </div>
            <progress className="progress progress-secondary w-full" value={contactRate} max={100} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Closed from contacted</span>
              <span className="font-semibold">{closeRate}%</span>
            </div>
            <progress className="progress w-full" value={closeRate} max={100} />
          </div>
        </div>
      </section>
    </main>
  );
}
