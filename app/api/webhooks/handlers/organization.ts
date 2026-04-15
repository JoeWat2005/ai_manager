import { prisma } from "@/lib/prisma";
import { badRequest, ok } from "../responses";
import { ClerkDeletedEventData, ClerkOrganizationEventData } from "../types";

export async function handleOrganizationUpsert(
  eventType: string,
  org: ClerkOrganizationEventData
): Promise<Response> {
  let createdByUserId: string | null = null;

  if (org.created_by) {
    const creator = await prisma.user.findUnique({
      where: { clerkUserId: org.created_by },
    });

    createdByUserId = creator?.id ?? null;
  }

  const savedOrg = await prisma.organization.upsert({
    where: { clerkOrgId: org.id },
    update: {
      name: org.name,
      slug: org.slug,
      imageUrl: org.image_url ?? null,
      createdByUserId,
    },
    create: {
      clerkOrgId: org.id,
      name: org.name,
      slug: org.slug,
      imageUrl: org.image_url ?? null,
      createdByUserId,
    },
  });

  return ok(eventType, "Organization synced", {
    clerkOrgId: org.id,
    organizationId: savedOrg.id,
    slug: savedOrg.slug,
    createdByUserId,
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