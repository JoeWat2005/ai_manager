// app/post-auth/page.tsx
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PostAuthPage() {
  const { userId, orgId, has } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/onboarding");
  }

  const client = await clerkClient();
  const org = await client.organizations.getOrganization({
    organizationId: orgId,
  });

  // Option A: check the paid plan slug/key
  const hasBasicPlan = has({ plan: "basic" });

  if (!hasBasicPlan) {
    redirect("/pricing");
  }

  redirect(`/${org.slug}/dashboard`);
}