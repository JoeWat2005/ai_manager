import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limitRaw = Number(searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 300) : 100;

  const notifications = await prisma.notificationEvent.findMany({
    where: {
      organizationId: access.organization.id,
      ...(status === "unread" || status === "read" || status === "archived"
        ? { status }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return Response.json({ ok: true, notifications });
}
