import { LinksManager } from "@/components/dashboard/LinksManager";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { getOrCreateLinkProfile } from "@/lib/dashboard/org-resources";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";

export default async function DashboardLinksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const profile = await getOrCreateLinkProfile(
    organization.id,
    `${organization.name} links`
  );

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Links"
        title="Public links manager"
        description="Build a linktree-style page for socials, booking links, and key destinations."
      />

      <LinksManager initialProfile={profile} />
    </main>
  );
}
