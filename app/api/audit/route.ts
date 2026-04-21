// Import a helper that ensures the user is authenticated and has access to an organization
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import Prisma (your database client)
import { prisma } from "@/lib/prisma";

// This handles GET requests to this API route
export async function GET(req: Request) {
  // Run access checks (auth + org + optional rules)
  const access = await requireDashboardApiOrg();

  // If access failed, return the error response (401, 403, etc.)
  if (!access.ok) {
    return access.response;
  }

  // Parse the request URL so we can read query parameters (?action=...&limit=...)
  const { searchParams } = new URL(req.url);

  // Get the "action" filter from the query string (can be null)
  const action = searchParams.get("action");

  // Get "limit" from query string, default to 150 if not provided
  // Convert it to a number
  const limitRaw = Number(searchParams.get("limit") ?? "150");

  // Validate and clamp the limit:
  // - must be a number
  // - minimum = 1
  // - maximum = 400
  // - fallback = 150 if invalid
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 400)
    : 150;

  // Query the database for audit logs
  const logs = await prisma.auditLog.findMany({
    where: {
      // Only fetch logs for the current organization
      organizationId: access.organization.id,

      // Conditionally add an "action" filter ONLY if it's a valid non-empty string
      ...(typeof action === "string" && action.trim().length > 0
        ? {
            // trim() removes whitespace
            // "as never" is a TypeScript workaround for strict typing
            action: action.trim() as never,
          }
        : {}),
    },

    // Sort logs by newest first
    orderBy: {
      createdAt: "desc",
    },

    // Limit how many results we return
    take: limit,
  });

  // Return the logs as JSON
  return Response.json({
    ok: true,
    logs,
  });
}