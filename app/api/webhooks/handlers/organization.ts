import { prisma } from "@/lib/prisma";
import { syncOrganizationMemberships } from "@/lib/clerk/membership-sync";
import { badRequest, ok } from "../clerk/responses";
import { ClerkDeletedEventData, ClerkOrganizationEventData } from "../clerk/types";

export async function handleOrganizationUpsert(
  eventType: string,
  org: ClerkOrganizationEventData
): Promise<Response> {
  const savedOrg = await prisma.organization.upsert({
    where: { clerkOrgId: org.id },
    update: {
      name: org.name,
      slug: org.slug,
    },
    create: {
      clerkOrgId: org.id,
      name: org.name,
      slug: org.slug,
    },
  });

  let membershipSync: unknown = null;
  try {
    membershipSync = await syncOrganizationMemberships(org.id);
  } catch (error) {
    membershipSync = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return ok(eventType, "Organization synced", {
    clerkOrgId: org.id,
    organizationId: savedOrg.id,
    slug: savedOrg.slug,
    membershipSync,
  });
}

export async function handleOrganizationDeleted(
  eventType: string,
  org: ClerkDeletedEventData
): Promise<Response> {
  if (!org.id) {
    return badRequest(eventType, "Deleted organization event missing id");
  }

  const result = await prisma.organization.deleteMany({
    where: { clerkOrgId: org.id },
  });

  return ok(eventType, "Organization deleted from local DB", {
    clerkOrgId: org.id,
    deletedCount: result.count,
  });
}
