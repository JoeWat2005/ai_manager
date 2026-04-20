import { OrganizationProfile } from "@clerk/nextjs";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { clerkAppearance } from "@/lib/clerk/appearance";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireDashboardPageOrg(slug);

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Organization"
        title="Members, invites, and organization profile"
        description="Manage your organization directly from the dashboard using Clerk-native controls."
      />

      <Card>
        <CardContent>
          <OrganizationProfile appearance={clerkAppearance} routing="hash" />
        </CardContent>
      </Card>
    </main>
  );
}
