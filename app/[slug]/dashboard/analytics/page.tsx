import { BookingsSourceDonutChart } from "@/components/dashboard/charts/BookingsSourceDonutChart";
import { BookingsVolumeChart } from "@/components/dashboard/charts/BookingsVolumeChart";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAnalyticsData } from "@/lib/dashboard/analytics";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";

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
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  // Cached for 5 minutes per org — avoids hitting the DB on every page load.
  // Cache key: ["analytics-leads", organization.id]
  const { statusGrouped, recentLeads } = await getAnalyticsData(organization.id);

  // Derive all aggregates from the single groupBy result
  let totalLeads = 0;
  let qualifiedLeads = 0;
  let contactedLeads = 0;
  let closedLeads = 0;
  const channelMap = new Map<string, number>();

  for (const row of statusGrouped) {
    const n = row._count._all;
    totalLeads += n;
    if (row.qualified) qualifiedLeads += n;
    if (row.status === "contacted") contactedLeads += n;
    if (row.status === "closed") closedLeads += n;
    channelMap.set(row.channel, (channelMap.get(row.channel) ?? 0) + n);
  }

  // Build 7-day trend
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
    const key = toDayKey(new Date(lead.createdAt));
    const point = dayLookup.get(key);
    if (!point) continue;
    point.inbound += 1;
    if (lead.qualified) point.qualified += 1;
  }

  const qualificationRate =
    totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const contactRate =
    qualifiedLeads > 0 ? Math.round((contactedLeads / qualifiedLeads) * 100) : 0;
  const closeRate =
    contactedLeads > 0 ? Math.round((closedLeads / contactedLeads) * 100) : 0;

  const channelSplit =
    channelMap.size > 0
      ? [...channelMap.entries()].map(([channel, value]) => ({
          label: channel === "phone" ? "Phone" : "Web chat",
          value,
        }))
      : [
          { label: "Phone", value: 0 },
          { label: "Web chat", value: 0 },
        ];

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Analytics"
        title="Reception performance insights"
        description="Lead funnel and channel trends from your AI receptionist operation."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total leads</CardDescription>
            <CardTitle className="text-3xl font-black">{totalLeads}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Qualification rate</CardDescription>
            <CardTitle className="text-3xl font-black text-primary">{qualificationRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Contact rate</CardDescription>
            <CardTitle className="text-3xl font-black">{contactRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Close rate</CardDescription>
            <CardTitle className="text-3xl font-black">{closeRate}%</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inbound vs qualified (last 7 days)</CardTitle>
            <CardDescription>Track top-of-funnel quality each day.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingsVolumeChart
              labels={trendPoints.map((point) => point.label)}
              newBookings={trendPoints.map((point) => point.inbound)}
              completedBookings={trendPoints.map((point) => point.qualified)}
              newSeriesName="Inbound"
              completedSeriesName="Qualified"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel split</CardTitle>
            <CardDescription>Where inbound conversations start.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingsSourceDonutChart items={channelSplit} totalLabel="Leads" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Funnel health</CardTitle>
          <CardDescription>
            Keep these conversion stages moving with daily ops reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Qualified from inbound</span>
              <span className="font-semibold">{qualificationRate}%</span>
            </div>
            <Progress value={qualificationRate} aria-label="Qualified from inbound" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Contacted from qualified</span>
              <span className="font-semibold">{contactRate}%</span>
            </div>
            <Progress value={contactRate} aria-label="Contacted from qualified" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Closed from contacted</span>
              <span className="font-semibold">{closeRate}%</span>
            </div>
            <Progress value={closeRate} aria-label="Closed from contacted" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
