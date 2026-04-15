// app/page.tsx
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId, orgId } = await auth();

  if (userId) {
    if (!orgId) {
      redirect("/onboarding");
    }

    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });

    redirect(`/${org.slug}/dashboard`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center gap-4">
      <Link href="/sign-in" className="btn">
        Sign in
      </Link>
      <Link href="/sign-up" className="btn">
        Sign up
      </Link>
    </main>
  );
}