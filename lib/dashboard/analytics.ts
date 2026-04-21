import { prisma } from "@/lib/prisma";

/**
 * Fetches all data needed for the analytics page directly from the database.
 *
 * We intentionally avoid caching so the dashboard reflects real-time updates
 * (new leads, updates, calls, chats, etc.)
 */
export async function getAnalyticsData(organizationId: string) {

  // --- DEFINE TIME WINDOW (last 7 days) ---

  const windowStart = new Date();

  // Reset to start of today (midnight)
  windowStart.setHours(0, 0, 0, 0);

  // Go back 6 days → total window = today + 6 previous days = 7 days
  windowStart.setDate(windowStart.getDate() - 6);

  // --- FETCH DATA IN PARALLEL ---

  const [statusGrouped, recentLeads] = await Promise.all([

    // 1. GROUPED ANALYTICS (aggregated counts)
    prisma.receptionLead.groupBy({
      by: ["status", "qualified", "channel"], // group dimensions
      where: { organizationId },              // filter by org
      _count: { _all: true },                 // count rows in each group
    }),

    // 2. RECENT LEADS (time-series data)
    prisma.receptionLead.findMany({
      where: {
        organizationId,
        createdAt: { gte: windowStart }, // only last 7 days
      },
      select: {
        createdAt: true,
        qualified: true,
      },
      orderBy: { createdAt: "asc" }, // needed for charts
    }),
  ]);

  // --- FORMAT RESPONSE ---

  return {

    // Aggregated counts (used for summary stats / charts)
    statusGrouped,

    // Time-series data (used for charts)
    recentLeads: recentLeads.map((lead) => ({
      createdAt: lead.createdAt.toISOString(), // convert Date → string
      qualified: lead.qualified,
    })),
  };
}