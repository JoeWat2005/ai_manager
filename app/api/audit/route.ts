import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const limitRaw = Number(searchParams.get("limit") ?? "150");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 400) : 150;

  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: access.organization.id,
      ...(typeof action === "string" && action.trim().length > 0
        ? { action: action.trim() as never }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return Response.json({ ok: true, logs });
}
