import { auth } from "@clerk/nextjs/server";
import { getOrganizationByClerkOrgId } from "@/lib/reception/org";

type AccessOptions = {
  requirePaidPlan?: boolean;
};

export type DashboardOrganization = Exclude<
  Awaited<ReturnType<typeof getOrganizationByClerkOrgId>>,
  null
>;

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
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return {
      ok: false,
      response: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const organization = await getOrganizationByClerkOrgId(orgId);
  if (!organization) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Organization not found" },
        { status: 404 }
      ),
    };
  }

  if (options.requirePaidPlan && !organization.hasPaidPlan) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "This feature requires a paid plan" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId,
    orgId,
    organization,
  };
}
