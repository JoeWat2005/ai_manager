import { auth } from "@clerk/nextjs/server"; // get current user + org
import { redirect } from "next/navigation";  // Next.js server-side redirect
import { getOrganizationByClerkOrgId } from "@/lib/reception/org";

// Guard for dashboard pages (NOT APIs)
export async function requireDashboardPageOrg(slug: string) {

  // Get authenticated user + organization from Clerk
  const { userId, orgId } = await auth();

  // --- AUTH CHECK ---
  // If not logged in → redirect to sign-in page
  if (!userId || !orgId) {
    redirect("/sign-in"); // stops execution immediately
  }

  // --- ORG LOOKUP ---
  // Fetch organization from your database
  const organization = await getOrganizationByClerkOrgId(orgId);

  // If organization doesn't exist → send to onboarding flow
  if (!organization) {
    redirect("/onboarding");
  }

  // --- URL VALIDATION ---
  // Ensure URL slug matches the user's actual organization
  if (organization.slug !== slug) {
    redirect(`/${organization.slug}/dashboard`);
  }

  // --- SUCCESS ---
  // Return validated context for the page
  return {
    userId,
    orgId,
    organization,
  };
}
