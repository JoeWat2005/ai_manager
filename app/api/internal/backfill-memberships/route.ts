import { syncOrganizationMemberships } from "@/lib/clerk/membership-sync";
import { prisma } from "@/lib/prisma";

const TOKEN_HEADER = "x-internal-backfill-token";
const AUTH_HEADER_PREFIX = "Bearer ";

function getProvidedToken(req: Request): string | null {
  const directHeader = req.headers.get(TOKEN_HEADER);
  if (directHeader) {
    return directHeader;
  }

  const authorization = req.headers.get("authorization");
  if (!authorization || !authorization.startsWith(AUTH_HEADER_PREFIX)) {
    return null;
  }

  return authorization.slice(AUTH_HEADER_PREFIX.length).trim() || null;
}

export async function POST(req: Request) {
  const expectedToken = process.env.INTERNAL_BACKFILL_TOKEN;
  if (!expectedToken) {
    return Response.json(
      {
        ok: false,
        error: "Missing INTERNAL_BACKFILL_TOKEN",
      },
      { status: 500 }
    );
  }

  const providedToken = getProvidedToken(req);
  if (!providedToken || providedToken !== expectedToken) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized",
        message: `Send ${TOKEN_HEADER} or Authorization: Bearer <token>`,
      },
      { status: 401 }
    );
  }

  const organizations = await prisma.organization.findMany({
    select: {
      clerkOrgId: true,
      slug: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const summaries: Array<{
    clerkOrgId: string;
    slug: string;
    fetched: number;
    upserted: number;
    pruned: number;
    skipped: number;
  }> = [];
  const errors: Array<{
    clerkOrgId: string;
    slug: string;
    error: string;
  }> = [];

  let fetched = 0;
  let upserted = 0;
  let pruned = 0;
  let skipped = 0;

  for (const organization of organizations) {
    try {
      const summary = await syncOrganizationMemberships(organization.clerkOrgId);
      summaries.push({
        clerkOrgId: organization.clerkOrgId,
        slug: organization.slug,
        fetched: summary.fetched,
        upserted: summary.upserted,
        pruned: summary.pruned,
        skipped: summary.skipped,
      });

      fetched += summary.fetched;
      upserted += summary.upserted;
      pruned += summary.pruned;
      skipped += summary.skipped;
    } catch (error) {
      errors.push({
        clerkOrgId: organization.clerkOrgId,
        slug: organization.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const status = errors.length > 0 ? 207 : 200;

  return Response.json(
    {
      ok: errors.length === 0,
      message: "Membership backfill completed",
      totals: {
        organizations: organizations.length,
        fetched,
        upserted,
        pruned,
        skipped,
        failedOrganizations: errors.length,
      },
      summaries,
      errors,
    },
    { status }
  );
}
