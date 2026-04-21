// Import function that syncs memberships from Clerk into your database
import { syncOrganizationMemberships } from "@/lib/clerk/membership-sync";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Custom header name for authentication
const TOKEN_HEADER = "x-internal-backfill-token";

// Standard Authorization header prefix
const AUTH_HEADER_PREFIX = "Bearer ";

/**
 * Extract token from request headers.
 * Supports:
 * 1. Custom header: x-internal-backfill-token
 * 2. Authorization: Bearer <token>
 */
function getProvidedToken(req: Request): string | null {
  // Try custom header first
  const directHeader = req.headers.get(TOKEN_HEADER);
  if (directHeader) {
    return directHeader;
  }

  // Otherwise try Authorization header
  const authorization = req.headers.get("authorization");

  // Must exist and start with "Bearer "
  if (!authorization || !authorization.startsWith(AUTH_HEADER_PREFIX)) {
    return null;
  }

  // Extract token after "Bearer "
  return authorization.slice(AUTH_HEADER_PREFIX.length).trim() || null;
}

// =====================
// POST: Run membership backfill
// =====================
export async function POST(req: Request) {
  // Read expected token from environment variables
  const expectedToken = process.env.INTERNAL_BACKFILL_TOKEN;

  // If server is misconfigured (no token set), fail
  if (!expectedToken) {
    return Response.json(
      {
        ok: false,
        error: "Missing INTERNAL_BACKFILL_TOKEN",
      },
      { status: 500 }
    );
  }

  // Get token provided in request
  const providedToken = getProvidedToken(req);

  // If token is missing or incorrect → unauthorized
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

  // Fetch all organizations from database
  const organizations = await prisma.organization.findMany({
    select: {
      clerkOrgId: true, // used to sync with Clerk
      slug: true,       // useful for reporting/debugging
    },
    orderBy: {
      id: "asc",
    },
  });

  // Store per-organization results
  const summaries: Array<{
    clerkOrgId: string;
    slug: string;
    fetched: number;
    upserted: number;
    pruned: number;
    skipped: number;
  }> = [];

  // Store errors for organizations that fail
  const errors: Array<{
    clerkOrgId: string;
    slug: string;
    error: string;
  }> = [];

  // Totals across all organizations
  let fetched = 0;
  let upserted = 0;
  let pruned = 0;
  let skipped = 0;

  // Loop through each organization
  for (const organization of organizations) {
    try {
      // Sync memberships for this org
      const summary = await syncOrganizationMemberships(
        organization.clerkOrgId
      );

      // Save per-org summary
      summaries.push({
        clerkOrgId: organization.clerkOrgId,
        slug: organization.slug,
        fetched: summary.fetched,
        upserted: summary.upserted,
        pruned: summary.pruned,
        skipped: summary.skipped,
      });

      // Accumulate totals
      fetched += summary.fetched;
      upserted += summary.upserted;
      pruned += summary.pruned;
      skipped += summary.skipped;
    } catch (error) {
      // If one org fails, don't stop everything
      errors.push({
        clerkOrgId: organization.clerkOrgId,
        slug: organization.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // If some orgs failed → return partial success (207 Multi-Status)
  const status = errors.length > 0 ? 207 : 200;

  // Return summary of the whole operation
  return Response.json(
    {
      ok: errors.length === 0,
      message: "Membership backfill completed",

      // Aggregate totals
      totals: {
        organizations: organizations.length,
        fetched,
        upserted,
        pruned,
        skipped,
        failedOrganizations: errors.length,
      },

      // Per-organization summaries
      summaries,

      // Any errors that occurred
      errors,
    },
    { status }
  );
}
