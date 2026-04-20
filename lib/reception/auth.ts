import { auth } from "@clerk/nextjs/server";
import { getOrganizationByClerkOrgId, getOrgNotificationFallbackEmail } from "./org";
import { getOrCreateReceptionistConfig } from "./org";

export async function requireAuthedOrganization() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return { ok: false as const, response: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const organization = await getOrganizationByClerkOrgId(orgId);
  if (!organization) {
    return {
      ok: false as const,
      response: Response.json({ ok: false, error: "Organization not found" }, { status: 404 }),
    };
  }

  if (!organization.hasPaidPlan) {
    return {
      ok: false as const,
      response: Response.json(
        { ok: false, error: "Receptionist is available on paid plans only" },
        { status: 403 }
      ),
    };
  }

  const fallbackEmail = await getOrgNotificationFallbackEmail(userId);
  const config = await getOrCreateReceptionistConfig(organization.id, fallbackEmail);

  return {
    ok: true as const,
    organization,
    userId,
    orgId,
    config,
  };
}
