import { prisma } from "@/lib/prisma";
import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { getOrgNotificationFallbackEmail, getOrCreateReceptionistConfig } from "./org";

// Main guard for receptionist-related routes
export async function requireAuthedOrganization() {

  // --- BASE ACCESS CHECK ---
  // Reuse your existing guard, but REQUIRE paid plan
  const access = await requireDashboardApiOrg({ requirePaidPlan: true });

  // If auth/org/plan fails → return error response
  if (!access.ok) {
    return access;
  }

  // --- FETCH CONFIG + FALLBACK EMAIL IN PARALLEL ---
  // This improves performance (no sequential DB calls)
  const [existingConfig, fallbackEmail] = await Promise.all([

    // Try to fetch existing receptionist config
    prisma.receptionistConfig.findUnique({
      where: { organizationId: access.organization.id },
    }),

    // Get fallback email (e.g. from user/org)
    getOrgNotificationFallbackEmail(access.userId),
  ]);

  // --- ENSURE CONFIG EXISTS ---
  // If config exists → use it
  // If not → create default config
  const config =
    existingConfig ??
    (await getOrCreateReceptionistConfig(
      access.organization.id,
      fallbackEmail
    ));

  // --- SUCCESS ---
  return {
    ok: true as const,
    organization: access.organization,
    userId: access.userId,
    orgId: access.orgId,
    config, // guaranteed to exist
  };
}