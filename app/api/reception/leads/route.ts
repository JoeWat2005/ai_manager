import { requireAuthedOrganization } from "@/lib/reception/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = new Set(["new", "contacted", "closed"]);

export async function GET(req: Request) {
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const limitParam = Number(searchParams.get("limit") ?? "50");

  const status =
    statusParam && VALID_STATUSES.has(statusParam) ? statusParam : undefined;
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

  const leads = await prisma.receptionLead.findMany({
    where: {
      organizationId: access.organization.id,
      ...(status ? { status: status as "new" | "contacted" | "closed" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json({
    ok: true,
    leads,
  });
}
