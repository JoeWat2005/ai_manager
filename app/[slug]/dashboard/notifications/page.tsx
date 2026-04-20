import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const notifications = await prisma.notificationEvent.findMany({
    where: {
      organizationId: organization.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Notifications"
        title="Operational notifications"
        description="Lead captures, booking confirms, transcript readiness, and billing events."
      />

      <Card>
        <CardContent>
          <NotificationsPanel
            initialNotifications={notifications.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </main>
  );
}
