import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { startTimer } from "@/lib/perf";

async function fetchAnalyticsData(organizationId: string) {
  const t = startTimer(`analytics DB queries [org=${organizationId}]`);
  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - 6);

  const [statusGrouped, recentLeads] = await Promise.all([
    prisma.receptionLead.groupBy({
      by: ["status", "qualified", "channel"],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.receptionLead.findMany({
      where: {
        organizationId,
        createdAt: { gte: windowStart },
      },
      select: {
        createdAt: true,
        qualified: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  t();

  return {
    statusGrouped,
    recentLeads: recentLeads.map((lead) => ({
      createdAt: lead.createdAt.toISOString(),
      qualified: lead.qualified,
    })),
  };
}

// Cache per org, refresh every 5 minutes.
const getAnalyticsDataCached = unstable_cache(
  fetchAnalyticsData,
  ["analytics-data"],
  { revalidate: 300 }
);

export async function getAnalyticsData(organizationId: string) {
  return getAnalyticsDataCached(organizationId);
}
