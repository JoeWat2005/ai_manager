import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrganizationByClerkOrgId } from "@/lib/reception/org";

export default async function ReceptionistLegacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId, orgId } = await auth();
  const { slug } = await params;

  if (!userId || !orgId) {
    redirect("/sign-in");
  }

  const organization = await getOrganizationByClerkOrgId(orgId);
  if (!organization) {
    redirect("/onboarding");
  }

  if (organization.slug !== slug) {
    redirect(`/${organization.slug}/dashboard/settings`);
  }

  redirect(`/${organization.slug}/dashboard/settings`);
}
