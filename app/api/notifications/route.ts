// Import access guard (checks auth + organization access)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Handle GET request to list notifications
export async function GET(req: Request) {
  // Ensure user is authenticated and belongs to an organization
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Parse query parameters from URL (?status=...&limit=...)
  const { searchParams } = new URL(req.url);

  // Optional filter: notification status
  const status = searchParams.get("status");

  // Parse limit (default = 100)
  const limitRaw = Number(searchParams.get("limit") ?? "100");

  // Validate and clamp limit:
  // - must be a number
  // - minimum = 1
  // - maximum = 300
  // - fallback = 100
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 300)
    : 100;

  // Query notifications from database
  const notifications = await prisma.notificationEvent.findMany({
    where: {
      // Only fetch notifications for this organization
      organizationId: access.organization.id,

      // Conditionally filter by status ONLY if valid
      ...(status === "unread" || status === "read" || status === "archived"
        ? { status }
        : {}),
    },

    // Sort newest first
    orderBy: {
      createdAt: "desc",
    },

    // Limit number of results
    take: limit,
  });

  // Return notifications
  return Response.json({
    ok: true,
    notifications,
  });
}
