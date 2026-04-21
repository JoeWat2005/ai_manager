// Import helper that ensures the user is authenticated
// and belongs to an organization (reception context)
import { requireAuthedOrganization } from "@/lib/reception/auth";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define allowed lead statuses using a Set (fast lookup)
const VALID_STATUSES = new Set(["new", "contacted", "closed"]);

// Handle GET request to list leads
export async function GET(req: Request) {
  // Check authentication + organization access
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  // Parse query parameters from URL (?status=...&limit=...)
  const { searchParams } = new URL(req.url);

  // Get optional status filter
  const statusParam = searchParams.get("status");

  // Get limit (default = 50)
  const limitParam = Number(searchParams.get("limit") ?? "50");

  // Validate status:
  // - must exist
  // - must be in VALID_STATUSES
  const status =
    statusParam && VALID_STATUSES.has(statusParam)
      ? statusParam
      : undefined;

  // Validate and clamp limit:
  // - minimum = 1
  // - maximum = 200
  // - fallback = 50
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 200)
    : 50;

  // Query leads from database
  const leads = await prisma.receptionLead.findMany({
    where: {
      // Only fetch leads for this organization
      organizationId: access.organization.id,

      // Conditionally filter by status if valid
      ...(status
        ? { status: status as "new" | "contacted" | "closed" }
        : {}),
    },

    // Include related contact information
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },

    // Sort newest leads first
    orderBy: {
      createdAt: "desc",
    },

    // Limit number of results
    take: limit,
  });

  // Return leads
  return Response.json({
    ok: true,
    leads,
  });
}
