import { auth } from "@clerk/nextjs/server"; // gets current user + org from Clerk
import { getOrganizationByClerkOrgId } from "@/lib/reception/org";

// Optional settings for access control
type AccessOptions = {
  requirePaidPlan?: boolean; // if true → only allow paid orgs
};

// Type: organization guaranteed NOT null
export type DashboardOrganization = Exclude<
  Awaited<ReturnType<typeof getOrganizationByClerkOrgId>>,
  null
>;

// Main guard function for API routes
export async function requireDashboardApiOrg(
  options: AccessOptions = {}
): Promise<
  | {
      ok: true;
      userId: string;
      orgId: string;
      organization: DashboardOrganization;
    }
  | {
      ok: false;
      response: Response;
    }
> {

  // Get authenticated user + organization from Clerk
  const { userId, orgId } = await auth();

  // --- AUTH CHECK ---
  // If no user or no org → not logged in properly
  if (!userId || !orgId) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // --- ORG LOOKUP ---
  // Fetch organization from your database
  const organization = await getOrganizationByClerkOrgId(orgId);

  // If org doesn't exist locally → error
  if (!organization) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Organization not found" },
        { status: 404 }
      ),
    };
  }

  // --- PLAN CHECK ---
  // If route requires paid plan but org doesn't have one → block access
  if (options.requirePaidPlan && !organization.hasPaidPlan) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "This feature requires a paid plan" },
        { status: 403 }
      ),
    };
  }

  // --- SUCCESS ---
  // Return all useful context for the route
  return {
    ok: true,
    userId,
    orgId,
    organization,
  };
}
