// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Import helper to sync all memberships for an organization from Clerk
import { syncOrganizationMemberships } from "@/lib/clerk/membership-sync";

// Import standard webhook response helpers
import { badRequest, ok } from "../clerk/responses";

// Import the expected shapes of Clerk org-related webhook payloads
import { ClerkDeletedEventData, ClerkOrganizationEventData } from "../clerk/types";

// Handle organization created/updated events
export async function handleOrganizationUpsert(
  eventType: string,
  org: ClerkOrganizationEventData
): Promise<Response> {
  // Create or update the local organization record using Clerk org ID as unique key
  const savedOrg = await prisma.organization.upsert({
    where: { clerkOrgId: org.id },

    // If organization already exists locally, update these fields
    update: {
      name: org.name,
      slug: org.slug,
    },

    // If organization does not exist locally, create it
    create: {
      clerkOrgId: org.id,
      name: org.name,
      slug: org.slug,
    },
  });

  // After syncing the org itself, try syncing its memberships too
  let membershipSync: unknown = null;
  try {
    membershipSync = await syncOrganizationMemberships(org.id);
  } catch (error) {
    // Do not fail the whole org sync just because membership sync failed
    membershipSync = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Return success response
  return ok(eventType, "Organization synced", {
    clerkOrgId: org.id,
    organizationId: savedOrg.id,
    slug: savedOrg.slug,
    membershipSync,
  });
}

// Handle organization deleted events
export async function handleOrganizationDeleted(
  eventType: string,
  org: ClerkDeletedEventData
): Promise<Response> {
  // Deleted event must include an ID
  if (!org.id) {
    return badRequest(eventType, "Deleted organization event missing id");
  }

  // Delete all local organization rows matching this Clerk org ID
  const result = await prisma.organization.deleteMany({
    where: { clerkOrgId: org.id },
  });

  // Return success response with how many rows were deleted
  return ok(eventType, "Organization deleted from local DB", {
    clerkOrgId: org.id,
    deletedCount: result.count,
  });
}