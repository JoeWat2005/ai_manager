// app/post-auth/page.tsx
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PostAuthPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // If an org is already active, go there
  if (orgId) {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({ organizationId: orgId });

    redirect(`/${org.slug}/dashboard`);
  }

  // Otherwise send them to create/select a business
  redirect("/onboarding");
}