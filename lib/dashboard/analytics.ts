import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Fetches all data needed for the analytics page and caches it for 5 minutes
 * per organisation. The two Prisma queries (groupBy + findMany) are parallelised
 * and their results returned as plain objects so Next.js can serialise them.
 *
 * Cache key: ["analytics-leads", organizationId]
 * TTL: 300 s (5 minutes)
 */
export const getAnalyticsData = unstable_cache(
  async (organizationId: string) => {
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
        select: { createdAt: true, qualified: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Serialise Date → ISO string so Next.js can cache the result
    return {
      statusGrouped,
      recentLeads: recentLeads.map((lead) => ({
        createdAt: lead.createdAt.toISOString(),
        qualified: lead.qualified,
      })),
    };
  },
  ["analytics-leads"],
  { revalidate: 300 }
);
