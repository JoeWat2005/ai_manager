import { cache } from "react";
import { getEffectivePlan, isPaidPlan } from "@/lib/billing/effective-plan";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BUSINESS_HOURS, getDefaultTimezone } from "./defaults";

type OrganizationWithPlan = {
  id: string;
  clerkOrgId: string;
  name: string;
  slug: string;
  hasPaidPlan: boolean;
  effectivePlan: string;
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function generateUniqueExtension(seed: string): Promise<string> {
  for (let i = 0; i < 200; i += 1) {
    const candidateNumber = (hashString(`${seed}:${i}`) % 9000) + 1000;
    const candidate = String(candidateNumber);
    const existing = await prisma.receptionistConfig.findUnique({
      where: { phoneExtension: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique phone extension");
}

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

export async function getOrCreateReceptionistConfig(
  organizationId: string,
  notificationEmailFallback: string
) {
  const existing = await prisma.receptionistConfig.findUnique({
    where: { organizationId },
  });

  if (existing) return existing;

  const extension = await generateUniqueExtension(organizationId);

  return prisma.receptionistConfig.create({
    data: {
      organizationId,
      phoneExtension: extension,
      notificationEmail: notificationEmailFallback,
      businessHoursJson: DEFAULT_BUSINESS_HOURS,
      faqScript:
        "You are Deskcaptain, a polite AI receptionist. Collect caller name, phone number, and the reason for the call. Do not promise legal, medical, or financial advice.",
      phoneEnabled: true,
      chatEnabled: true,
      timezone: getDefaultTimezone(),
    },
  });
}

export async function getOrgNotificationFallbackEmail(
  clerkUserId: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { email: true },
  });
  return user?.email ?? "missing-email@deskcaptain.local";
}
