import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Number of records to fetch per page when calling Clerk API
const PAGE_SIZE = 100;

// --- TYPES ---

// Local DB user shape
type LocalUser = {
  id: string;
  clerkUserId: string;
  email: string;
};

// Simplified Clerk membership record
type ClerkOrganizationMembershipRecord = {
  role?: string | null;
  publicUserData?: {
    userId?: string | null;
  } | null;
};

// Simplified Clerk user record
type ClerkUserRecord = {
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
  emailAddresses?: Array<{
    emailAddress?: string | null;
  }>;
};

// Type for Clerk backend client
type ClerkBackendClient = Awaited<ReturnType<typeof clerkClient>>;

// Summary returned after syncing
export type MembershipSyncSummary = {
  clerkOrgId: string;
  fetched: number;   // how many memberships fetched from Clerk
  upserted: number; // how many saved/updated locally
  pruned: number;   // how many removed locally
  skipped: number;  // how many skipped (invalid/missing data)
};

// --- HELPERS ---

// Extract the best available email from a Clerk user
function getPrimaryEmail(user: ClerkUserRecord): string | null {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.find((email) => !!email.emailAddress)?.emailAddress ??
    null
  );
}

// Ensure a Clerk user exists in local DB (create or update)
async function upsertLocalUserFromClerk(
  client: ClerkBackendClient,
  clerkUserId: string
): Promise<LocalUser | null> {

  // Fetch user from Clerk
  const clerkUser = await client.users.getUser(clerkUserId);

  const primaryEmail = getPrimaryEmail(clerkUser);
  if (!primaryEmail) {
    return null; // skip if no email
  }

  // Upsert into local DB
  return prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email: primaryEmail,
    },
    create: {
      clerkUserId,
      email: primaryEmail,
    },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
    },
  });
}

// Fetch ALL memberships for an organization from Clerk (with pagination)
async function getOrganizationMembershipsFromClerk(
  client: ClerkBackendClient,
  clerkOrgId: string
): Promise<ClerkOrganizationMembershipRecord[]> {

  const memberships: ClerkOrganizationMembershipRecord[] = [];
  let offset = 0;

  while (true) {
    const page = await client.organizations.getOrganizationMembershipList({
      organizationId: clerkOrgId,
      limit: PAGE_SIZE,
      offset,
    });

    // Stop if no more data
    if (page.data.length === 0) break;

    // Normalize data shape
    for (const membership of page.data) {
      memberships.push({
        role: membership.role,
        publicUserData: membership.publicUserData
          ? { userId: membership.publicUserData.userId }
          : null,
      });
    }

    offset += page.data.length;

    // Stop if we've fetched everything
    if (offset >= page.totalCount) break;
  }

  return memberships;
}

// Get all organization IDs for a user
export async function listUserOrganizationIds(
  clerkUserId: string
): Promise<string[]> {

  const client = await clerkClient();
  const organizationIds = new Set<string>();
  let offset = 0;

  while (true) {
    const page = await client.users.getOrganizationMembershipList({
      userId: clerkUserId,
      limit: PAGE_SIZE,
      offset,
    });

    if (page.data.length === 0) break;

    for (const membership of page.data) {
      const orgId = membership.organization.id;
      if (orgId) {
        organizationIds.add(orgId);
      }
    }

    offset += page.data.length;
    if (offset >= page.totalCount) break;
  }

  return [...organizationIds];
}

// --- MAIN SYNC FUNCTION ---

export async function syncOrganizationMemberships(
  clerkOrgId: string,
  options?: { prune?: boolean }
): Promise<MembershipSyncSummary> {

  const shouldPrune = options?.prune ?? true;

  // Track results
  const summary: MembershipSyncSummary = {
    clerkOrgId,
    fetched: 0,
    upserted: 0,
    pruned: 0,
    skipped: 0,
  };

  // Find local organization
  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });

  if (!organization) {
    return summary; // nothing to sync
  }

  const client = await clerkClient();

  // Fetch memberships from Clerk
  const remoteMemberships = await getOrganizationMembershipsFromClerk(
    client,
    clerkOrgId
  );

  summary.fetched = remoteMemberships.length;

  // Extract unique Clerk user IDs
  const clerkUserIds = [
    ...new Set(
      remoteMemberships
        .map((m) => m.publicUserData?.userId ?? null)
        .filter((id): id is string => !!id)
    ),
  ];

  // Fetch existing local users
  const existingUsers =
    clerkUserIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: {
            clerkUserId: { in: clerkUserIds },
          },
          select: {
            id: true,
            clerkUserId: true,
            email: true,
          },
        });

  // Map for quick lookup
  const localUsersByClerkId = new Map(
    existingUsers.map((user) => [user.clerkUserId, user])
  );

  const seenLocalUserIds = new Set<string>();

  // Process each membership
  for (const membership of remoteMemberships) {
    const clerkUserId = membership.publicUserData?.userId ?? null;

    if (!clerkUserId) {
      summary.skipped += 1;
      continue;
    }

    let localUser = localUsersByClerkId.get(clerkUserId) ?? null;

    // If user not found locally → fetch + create
    if (!localUser) {
      try {
        localUser = await upsertLocalUserFromClerk(client, clerkUserId);
      } catch {
        localUser = null;
      }

      if (!localUser) {
        summary.skipped += 1;
        continue;
      }

      localUsersByClerkId.set(clerkUserId, localUser);
    }

    // Upsert membership in local DB
    await prisma.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: localUser.id,
          organizationId: organization.id,
        },
      },
      update: {
        role: membership.role ?? "member",
      },
      create: {
        userId: localUser.id,
        organizationId: organization.id,
        role: membership.role ?? "member",
      },
    });

    seenLocalUserIds.add(localUser.id);
    summary.upserted += 1;
  }

  // --- PRUNE STEP (remove users no longer in Clerk) ---
  if (shouldPrune) {
    const pruneResult =
      seenLocalUserIds.size === 0
        ? await prisma.organizationMembership.deleteMany({
            where: { organizationId: organization.id },
          })
        : await prisma.organizationMembership.deleteMany({
            where: {
              organizationId: organization.id,
              userId: {
                notIn: [...seenLocalUserIds],
              },
            },
          });

    summary.pruned = pruneResult.count;
  }

  return summary;
}