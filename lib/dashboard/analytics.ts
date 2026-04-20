import { prisma } from "@/lib/prisma";

/**
 * Fetches all data needed for the analytics page directly from the database.
 *
 * We intentionally avoid a long-lived cross-request cache here because
 * dashboard actions like seeding, lead updates, and new calls/chats should
 * reflect in analytics immediately during development and MVP operations.
 */
export async function getAnalyticsData(organizationId: string) {
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

  return {
    statusGrouped,
    recentLeads: recentLeads.map((lead) => ({
      createdAt: lead.createdAt.toISOString(),
      qualified: lead.qualified,
    })),
  };
}
