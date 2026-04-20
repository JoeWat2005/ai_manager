import { AuditLogTable } from "@/components/dashboard/AuditLogTable";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId: organization.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 250,
  });

  const rows = logs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    action: log.action,
    description: log.description,
    targetType: log.targetType,
    targetId: log.targetId,
    actorUserId: log.actorUserId,
  }));

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Audit"
        title="Security and admin activity log"
        description="Track key actions across settings, links, bookings, notifications, and billing."
      />

      <Card>
        <CardContent className="overflow-x-auto">
          <AuditLogTable logs={rows} />
        </CardContent>
      </Card>
    </main>
  );
}
