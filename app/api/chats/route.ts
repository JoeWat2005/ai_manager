// Import access guard (checks auth + organization access)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Handle GET request (fetch list of conversations)
export async function GET(req: Request) {
  // Ensure user is authenticated and belongs to an organization
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Parse query parameters from the URL (?channel=...&outcome=...&limit=...)
  const { searchParams } = new URL(req.url);

  // Optional filter: channel (e.g. "phone" or "web")
  const channel = searchParams.get("channel");

  // Optional filter: outcome (e.g. "qualified", "lost", etc.)
  const outcome = searchParams.get("outcome");

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

  // Query database for conversations
  const conversations = await prisma.receptionConversation.findMany({
    where: {
      // Only fetch conversations for this organization
      organizationId: access.organization.id,

      // Conditionally filter by channel ONLY if valid ("phone" or "web")
      ...(channel === "phone" || channel === "web"
        ? { channel }
        : {}),

      // Conditionally filter by outcome if it's a non-empty string
      ...(typeof outcome === "string" && outcome.trim().length > 0
        ? { outcome: outcome.trim() }
        : {}),
    },

    // Include related data
    include: {
      // Lead information
      lead: {
        select: {
          id: true,
          qualified: true,
          status: true,

          // Nested contact info
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },

      // Call recording details (if conversation was a phone call)
      callRecording: {
        select: {
          id: true,
          recordingUrl: true,
          durationSeconds: true,
          transcriptSummary: true,
          updatedAt: true,
        },
      },

      // Count related records (number of messages in the conversation)
      _count: {
        select: {
          messages: true,
        },
      },
    },

    // Sort conversations by most recently updated
    orderBy: {
      updatedAt: "desc",
    },

    // Limit number of results returned
    take: limit,
  });

  // Return the conversations
  return Response.json({
    ok: true,
    conversations,
  });
}