// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Import helper that can re-sync all memberships for an organization from Clerk
import { syncOrganizationMemberships } from "@/lib/clerk/membership-sync";

// Import standard webhook response helpers
import { badRequest, ok } from "../clerk/responses";

// Import the expected shape of Clerk membership event data
import { ClerkOrganizationMembershipEventData } from "../clerk/types";

// Handle membership created/updated events
export async function handleMembershipUpsert(
  eventType: string,
  membership: ClerkOrganizationMembershipEventData
): Promise<Response> {
  // Extract Clerk user ID and Clerk organization ID from webhook payload
  const clerkUserId = membership.public_user_data?.user_id ?? null;
  const clerkOrgId = membership.organization?.id ?? null;

  // If required IDs are missing, we cannot continue
  if (!clerkUserId || !clerkOrgId) {
    return badRequest(eventType, "Membership missing user or organization", {
      membership,
    });
  }

  // Find the local user by Clerk user ID
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  // Find the local organization by Clerk org ID
  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  // If user or org has not been synced locally yet, we cannot create membership safely
  if (!user || !organization) {
    let reconciliation: unknown = null;

    // If organization exists locally, try a full membership re-sync for that org
    if (organization) {
      try {
        reconciliation = await syncOrganizationMemberships(clerkOrgId);
      } catch (error) {
        reconciliation = {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Do not treat this as a hard failure; just report it and move on
    return ok(
      eventType,
      "Membership skipped because dependent records are not synced yet",
      {
        clerkUserId,
        clerkOrgId,
        foundUser: !!user,
        foundOrganization: !!organization,
        reconciliation,
      }
    );
  }

  // Create or update the membership in the local DB
  const savedMembership = await prisma.organizationMembership.upsert({
    where: {
      // Composite unique key: one membership per user+organization
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: {
      // If membership already exists, update its role
      role: membership.role ?? "member",
    },
    create: {
      // If membership does not exist, create it
      userId: user.id,
      organizationId: organization.id,
      role: membership.role ?? "member",
    },
  });

  // Return success response
  return ok(eventType, "Membership synced", {
    membershipId: savedMembership.id,
    clerkUserId,
    clerkOrgId,
    role: savedMembership.role,
  });
}

// Handle membership deleted events
export async function handleMembershipDeleted(
  eventType: string,
  membership: ClerkOrganizationMembershipEventData
): Promise<Response> {
  // Extract Clerk IDs from webhook payload
  const clerkUserId = membership.public_user_data?.user_id ?? null;
  const clerkOrgId = membership.organization?.id ?? null;

  // If required IDs are missing, request is invalid
  if (!clerkUserId || !clerkOrgId) {
    return badRequest(eventType, "Membership missing user or organization", {
      membership,
    });
  }

  // Find local user
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  // Find local organization
  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  });

  // If local records do not exist, nothing to delete
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

  // Delete matching membership(s) from local DB
  const result = await prisma.organizationMembership.deleteMany({
    where: {
      userId: user.id,
      organizationId: organization.id,
    },
  });

  // Return success response with delete count
  return ok(eventType, "Membership deleted from local DB", {
    clerkUserId,
    clerkOrgId,
    deletedCount: result.count,
  });
}
