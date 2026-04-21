// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Import helpers for Clerk membership syncing
import {
  listUserOrganizationIds,
  syncOrganizationMemberships,
} from "@/lib/clerk/membership-sync";

// Import standard webhook response helpers
import { badRequest, ok } from "../clerk/responses";

// Import expected shapes for Clerk user-related webhook payloads
import { ClerkDeletedEventData, ClerkUserEventData } from "../clerk/types";

// Handle user created/updated events
export async function handleUserUpsert(
  eventType: string,
  user: ClerkUserEventData
): Promise<Response> {
  // Find the user's primary email address by matching the primary email ID
  const primaryEmail =
    user.email_addresses?.find(
      (email) => email.id === user.primary_email_address_id
    )?.email_address ?? null;

  // If no primary email exists, this user payload is not usable for local sync
  if (!primaryEmail) {
    return badRequest(eventType, "User missing primary email", {
      clerkUserId: user.id,
      primaryEmailAddressId: user.primary_email_address_id,
      emailAddresses: user.email_addresses,
    });
  }

  // Upsert the local user record using Clerk user ID as the unique key
  const savedUser = await prisma.user.upsert({
    where: { clerkUserId: user.id },

    // Update existing user
    update: {
      email: primaryEmail,
    },

    // Create new user
    create: {
      clerkUserId: user.id,
      email: primaryEmail,
    },
  });

  // Collect results from follow-up membership sync attempts
  const membershipSync: unknown[] = [];
  const membershipSyncErrors: unknown[] = [];

  try {
    // Ask Clerk which organizations this user belongs to
    const clerkOrgIds = await listUserOrganizationIds(user.id);

    // For each org, try to sync memberships into the local DB
    for (const clerkOrgId of clerkOrgIds) {
      try {
        const summary = await syncOrganizationMemberships(clerkOrgId);
        membershipSync.push(summary);
      } catch (error) {
        membershipSyncErrors.push({
          clerkOrgId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    // If we fail even listing org IDs, record that too
    membershipSyncErrors.push({
      scope: "listUserOrganizationIds",
      clerkUserId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Return success response with sync details
  return ok(eventType, "User synced", {
    clerkUserId: user.id,
    userId: savedUser.id,
    email: savedUser.email,
    membershipSync,
    membershipSyncErrors,
  });
}

// Handle user deleted events
export async function handleUserDeleted(
  eventType: string,
  user: ClerkDeletedEventData
): Promise<Response> {
  // Deleted event must include an ID
  if (!user.id) {
    return badRequest(eventType, "Deleted user event missing id");
  }

  // Delete local user(s) matching this Clerk user ID
  const result = await prisma.user.deleteMany({
    where: { clerkUserId: user.id },
  });

  // Return success response
  return ok(eventType, "User deleted from local DB", {
    clerkUserId: user.id,
    deletedCount: result.count,
  });
}