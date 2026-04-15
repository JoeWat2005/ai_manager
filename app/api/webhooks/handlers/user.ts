import { prisma } from "@/lib/prisma";
import {
  listUserOrganizationIds,
  syncOrganizationMemberships,
} from "@/lib/clerk/membership-sync";
import { badRequest, ok } from "../clerk/responses";
import { ClerkDeletedEventData, ClerkUserEventData } from "../clerk/types";

export async function handleUserUpsert(
  eventType: string,
  user: ClerkUserEventData
): Promise<Response> {
  const primaryEmail =
    user.email_addresses?.find(
      (email) => email.id === user.primary_email_address_id
    )?.email_address ?? null;

  if (!primaryEmail) {
    return badRequest(eventType, "User missing primary email", {
      clerkUserId: user.id,
      primaryEmailAddressId: user.primary_email_address_id,
      emailAddresses: user.email_addresses,
    });
  }

  const savedUser = await prisma.user.upsert({
    where: { clerkUserId: user.id },
    update: {
      email: primaryEmail,
    },
    create: {
      clerkUserId: user.id,
      email: primaryEmail,
    },
  });

  const membershipSync: unknown[] = [];
  const membershipSyncErrors: unknown[] = [];

  try {
    const clerkOrgIds = await listUserOrganizationIds(user.id);

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
    membershipSyncErrors.push({
      scope: "listUserOrganizationIds",
      clerkUserId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return ok(eventType, "User synced", {
    clerkUserId: user.id,
    userId: savedUser.id,
    email: savedUser.email,
    membershipSync,
    membershipSyncErrors,
  });
}

export async function handleUserDeleted(
  eventType: string,
  user: ClerkDeletedEventData
): Promise<Response> {
  if (!user.id) {
    return badRequest(eventType, "Deleted user event missing id");
  }

  const result = await prisma.user.deleteMany({
    where: { clerkUserId: user.id },
  });

  return ok(eventType, "User deleted from local DB", {
    clerkUserId: user.id,
    deletedCount: result.count,
  });
}
