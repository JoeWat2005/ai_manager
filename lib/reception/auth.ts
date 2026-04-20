import { prisma } from "@/lib/prisma";
import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { getOrgNotificationFallbackEmail, getOrCreateReceptionistConfig } from "./org";

export async function requireAuthedOrganization() {
  const access = await requireDashboardApiOrg({ requirePaidPlan: true });
  if (!access.ok) {
    return access;
  }

  // Run existing-config lookup and user-email lookup in parallel.
  // In the happy path (config already exists) this eliminates one sequential round-trip.
  const [existingConfig, fallbackEmail] = await Promise.all([
    prisma.receptionistConfig.findUnique({
      where: { organizationId: access.organization.id },
    }),
    getOrgNotificationFallbackEmail(access.userId),
  ]);

  const config =
    existingConfig ??
    (await getOrCreateReceptionistConfig(access.organization.id, fallbackEmail));

  return {
    ok: true as const,
    organization: access.organization,
    userId: access.userId,
    orgId: access.orgId,
    config,
  };
}
