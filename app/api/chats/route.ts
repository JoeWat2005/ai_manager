import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");
  const outcome = searchParams.get("outcome");
  const limitRaw = Number(searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 300) : 100;

  const conversations = await prisma.receptionConversation.findMany({
    where: {
      organizationId: access.organization.id,
      ...(channel === "phone" || channel === "web" ? { channel } : {}),
      ...(typeof outcome === "string" && outcome.trim().length > 0
        ? { outcome: outcome.trim() }
        : {}),
    },
    include: {
      lead: {
        select: {
          id: true,
          qualified: true,
          status: true,
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      callRecording: {
        select: {
          id: true,
          recordingUrl: true,
          durationSeconds: true,
          transcriptSummary: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
  });

  return Response.json({ ok: true, conversations });
}
