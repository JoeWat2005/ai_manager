import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 100;

type LocalUser = {
  id: string;
  clerkUserId: string;
  email: string;
};

type ClerkOrganizationMembershipRecord = {
  role?: string | null;
  publicUserData?: {
    userId?: string | null;
  } | null;
};

type ClerkUserRecord = {
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
  emailAddresses?: Array<{
    emailAddress?: string | null;
  }>;
};

type ClerkBackendClient = Awaited<ReturnType<typeof clerkClient>>;

export type MembershipSyncSummary = {
  clerkOrgId: string;
  fetched: number;
  upserted: number;
  pruned: number;
  skipped: number;
};

function getPrimaryEmail(user: ClerkUserRecord): string | null {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.find((email) => !!email.emailAddress)?.emailAddress ??
    null
  );
}

async function upsertLocalUserFromClerk(
  client: ClerkBackendClient,
  clerkUserId: string
): Promise<LocalUser | null> {
  const clerkUser = await client.users.getUser(clerkUserId);
  const primaryEmail = getPrimaryEmail(clerkUser);

  if (!primaryEmail) {
    return null;
  }

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

    if (page.data.length === 0) {
      break;
    }

    for (const membership of page.data) {
      memberships.push({
        role: membership.role,
        publicUserData: membership.publicUserData
          ? {
              userId: membership.publicUserData.userId,
            }
          : null,
      });
    }

    offset += page.data.length;
    if (offset >= page.totalCount) {
      break;
    }
  }

  return memberships;
}

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

    if (page.data.length === 0) {
      break;
    }

    for (const membership of page.data) {
      const orgId = membership.organization.id;
      if (orgId) {
        organizationIds.add(orgId);
      }
    }

    offset += page.data.length;
    if (offset >= page.totalCount) {
      break;
    }
  }

  return [...organizationIds];
}

export async function syncOrganizationMemberships(
  clerkOrgId: string,
  options?: {
    prune?: boolean;
  }
): Promise<MembershipSyncSummary> {
  const shouldPrune = options?.prune ?? true;
  const summary: MembershipSyncSummary = {
    clerkOrgId,
    fetched: 0,
    upserted: 0,
    pruned: 0,
    skipped: 0,
  };

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true },
  });

  if (!organization) {
    return summary;
  }

  const client = await clerkClient();
  const remoteMemberships = await getOrganizationMembershipsFromClerk(
    client,
    clerkOrgId
  );
  summary.fetched = remoteMemberships.length;

  const clerkUserIds = [
    ...new Set(
      remoteMemberships
        .map((membership) => membership.publicUserData?.userId ?? null)
        .filter((userId): userId is string => !!userId)
    ),
  ];

  const existingUsers =
    clerkUserIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: {
            clerkUserId: {
              in: clerkUserIds,
            },
          },
          select: {
            id: true,
            clerkUserId: true,
            email: true,
          },
        });

  const localUsersByClerkId = new Map(
    existingUsers.map((user) => [user.clerkUserId, user])
  );

  const seenLocalUserIds = new Set<string>();

  for (const membership of remoteMemberships) {
    const clerkUserId = membership.publicUserData?.userId ?? null;
    if (!clerkUserId) {
      summary.skipped += 1;
      continue;
    }

    let localUser = localUsersByClerkId.get(clerkUserId) ?? null;

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

  if (shouldPrune) {
    const pruneResult =
      seenLocalUserIds.size === 0
        ? await prisma.organizationMembership.deleteMany({
            where: {
              organizationId: organization.id,
            },
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
