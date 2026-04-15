import { prisma } from "@/lib/prisma";
import { badRequest, ok } from "../clerk/responses";
import { ClerkOrganizationMembershipEventData } from "../clerk/types";

export async function handleMembershipUpsert(
  eventType: string,
  membership: ClerkOrganizationMembershipEventData
): Promise<Response> {
  const clerkUserId = membership.public_user_data?.user_id ?? null;
  const clerkOrgId = membership.organization?.id ?? null;

  if (!clerkUserId || !clerkOrgId) {
    return badRequest(eventType, "Membership missing user or organization", {
      membership,
    });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  if (!user || !organization) {
    return ok(
        eventType,
        "Membership skipped because dependent records are not synced yet",
        {
        clerkUserId,
        clerkOrgId,
        foundUser: !!user,
        foundOrganization: !!organization,
        }
    );
    }

  const savedMembership = await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: {
      role: membership.role ?? "member",
    },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: membership.role ?? "member",
    },
  });

  return ok(eventType, "Membership synced", {
    membershipId: savedMembership.id,
    clerkUserId,
    clerkOrgId,
    role: savedMembership.role,
  });
}

export async function handleMembershipDeleted(
  eventType: string,
  membership: ClerkOrganizationMembershipEventData
): Promise<Response> {
  const clerkUserId = membership.public_user_data?.user_id ?? null;
  const clerkOrgId = membership.organization?.id ?? null;

  if (!clerkUserId || !clerkOrgId) {
    return badRequest(eventType, "Membership missing user or organization", {
      membership,
    });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  if (!user || !organization) {
    return ok(
      eventType,
      "Membership delete skipped because local records do not exist",
      {
        clerkUserId,
        clerkOrgId,
        foundUser: !!user,
        foundOrganization: !!organization,
      }
    );
  }

  const result = await prisma.organizationMembership.deleteMany({
    where: {
      userId: user.id,
      organizationId: organization.id,
    },
  });

  return ok(eventType, "Membership deleted from local DB", {
    clerkUserId,
    clerkOrgId,
    deletedCount: result.count,
  });
}