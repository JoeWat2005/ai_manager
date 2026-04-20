import { CustomizationForm } from "@/components/dashboard/CustomizationForm";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { getOrCreatePageCustomization } from "@/lib/dashboard/org-resources";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";

export default async function DashboardCustomizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);

  const customization = await getOrCreatePageCustomization(
    organization.id,
    organization.name
  );

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Customization"
        title="Landing and links styling"
        description="Curated page controls for copy, CTA labels, and accent styling."
      />

      <CustomizationForm initialCustomization={customization} />
    </main>
  );
}
