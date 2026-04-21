import { cache } from "react";
import { getEffectivePlan, isPaidPlan } from "@/lib/billing/effective-plan";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BUSINESS_HOURS, getDefaultTimezone } from "./defaults";

// Shape returned by organization lookup helpers
type OrganizationWithPlan = {
  id: string;
  clerkOrgId: string;
  name: string;
  slug: string;
  hasPaidPlan: boolean;
  effectivePlan: string;
};

// Simple string hash function used to generate deterministic numbers
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // force 32-bit integer
  }
  return Math.abs(hash);
}

// Generate a unique 4-digit phone extension for an organization
async function generateUniqueExtension(seed: string): Promise<string> {
  for (let i = 0; i < 200; i += 1) {
    // Generate a number between 1000 and 9999
    const candidateNumber = (hashString(`${seed}:${i}`) % 9000) + 1000;
    const candidate = String(candidateNumber);

    // Check if this extension is already taken
    const existing = await prisma.receptionistConfig.findUnique({
      where: { phoneExtension: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  // Give up after 200 tries
  throw new Error("Unable to generate unique phone extension");
}

// Lookup organization by public slug
// `cache(...)` memoizes this during a server render/request
export const getOrganizationBySlug = cache(async function getOrganizationBySlug(
  slug: string
): Promise<OrganizationWithPlan | null> {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      clerkOrgId: true,
      name: true,
      slug: true,

      // Also fetch subscription items so we can derive effective plan
      subscription: {
        select: {
          items: {
            select: {
              plan: true,
              status: true,
              periodEnd: true,
            },
            orderBy: [{ periodStart: "asc" }, { id: "asc" }],
          },
        },
      },
    },
  });

  if (!organization) return null;

  const items = organization.subscription?.items ?? [];
  const plan = getEffectivePlan(items);

  return {
    id: organization.id,
    clerkOrgId: organization.clerkOrgId,
    name: organization.name,
    slug: organization.slug,
    hasPaidPlan: isPaidPlan(plan),
    effectivePlan: plan,
  };
});

// Lookup organization by receptionist phone extension
export const getOrganizationByPhoneExtension = cache(
  async function getOrganizationByPhoneExtension(
    phoneExtension: string
  ): Promise<OrganizationWithPlan | null> {
    const config = await prisma.receptionistConfig.findUnique({
      where: { phoneExtension },
      select: {
        organization: {
          select: {
            id: true,
            clerkOrgId: true,
            name: true,
            slug: true,
            subscription: {
              select: {
                items: {
                  select: {
                    plan: true,
                    status: true,
                    periodEnd: true,
                  },
                  orderBy: [{ periodStart: "asc" }, { id: "asc" }],
                },
              },
            },
          },
        },
      },
    });

    if (!config?.organization) return null;

    const organization = config.organization;
    const items = organization.subscription?.items ?? [];
    const plan = getEffectivePlan(items);

    return {
      id: organization.id,
      clerkOrgId: organization.clerkOrgId,
      name: organization.name,
      slug: organization.slug,
      hasPaidPlan: isPaidPlan(plan),
      effectivePlan: plan,
    };
  }
);

// Lookup organization by Clerk org ID
export const getOrganizationByClerkOrgId = cache(
  async function getOrganizationByClerkOrgId(
    clerkOrgId: string
  ): Promise<OrganizationWithPlan | null> {
    const organization = await prisma.organization.findUnique({
      where: { clerkOrgId },
      select: {
        id: true,
        clerkOrgId: true,
        name: true,
        slug: true,
        subscription: {
          select: {
            items: {
              select: {
                plan: true,
                status: true,
                periodEnd: true,
              },
              orderBy: [{ periodStart: "asc" }, { id: "asc" }],
            },
          },
        },
      },
    });

    if (!organization) return null;

    const items = organization.subscription?.items ?? [];
    const plan = getEffectivePlan(items);

    return {
      id: organization.id,
      clerkOrgId: organization.clerkOrgId,
      name: organization.name,
      slug: organization.slug,
      hasPaidPlan: isPaidPlan(plan),
      effectivePlan: plan,
    };
  }
);

// Ensure receptionist config exists for an organization
export async function getOrCreateReceptionistConfig(
  organizationId: string,
  notificationEmailFallback: string
) {
  // Try existing config first
  const existing = await prisma.receptionistConfig.findUnique({
    where: { organizationId },
  });

  if (existing) return existing;

  // Otherwise create a default config with a unique phone extension
  const extension = await generateUniqueExtension(organizationId);

  return prisma.receptionistConfig.create({
    data: {
      organizationId,
      phoneExtension: extension,
      notificationEmail: notificationEmailFallback,
      businessHoursJson: DEFAULT_BUSINESS_HOURS,

      // Default prompt/instructions for the receptionist AI
      faqScript:
        "You are Deskcaptain, a polite AI receptionist. Collect caller name, phone number, and the reason for the call. Do not promise legal, medical, or financial advice.",

      phoneEnabled: true,
      chatEnabled: true,
      timezone: getDefaultTimezone(),
    },
  });
}

// Get fallback notification email for an org, based on current user
export async function getOrgNotificationFallbackEmail(
  clerkUserId: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { email: true },
  });

  // If user email is missing, return a placeholder
  return user?.email ?? "missing-email@deskcaptain.local";
}
