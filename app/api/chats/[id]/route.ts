// Import access guard (ensures user is authenticated and belongs to an organization)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Handle GET request to fetch a single conversation by ID
export async function GET(
  _req: Request, // request object (unused here, hence the underscore)
  { params }: { params: Promise<{ id: string }> } // dynamic route param: /api/conversations/[id]
) {
  // Check authentication + organization access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Extract conversation ID from route params
  const { id } = await params;

  // Validate ID
  if (!id) {
    return Response.json(
      { ok: false, error: "Conversation id is required" },
      { status: 400 }
    );
  }

  // Query the database for the conversation
  const conversation = await prisma.receptionConversation.findFirst({
    where: {
      id,
      // Ensure this conversation belongs to the current organization (security)
      organizationId: access.organization.id,
    },

    // Include related data
    include: {
      // Lead associated with the conversation
      lead: {
        include: {
          // Contact details of the lead
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

      // All messages in this conversation
      messages: {
        orderBy: {
          // Oldest first (so conversation reads in order)
          createdAt: "asc",
        },
      },

      // Optional call recording (if this was a phone interaction)
      callRecording: true,
    },
  });

  // If no conversation found → return 404
  if (!conversation) {
    return Response.json(
      { ok: false, error: "Conversation not found" },
      { status: 404 }
    );
  }

  // Return the full conversation with all related data
  return Response.json({
    ok: true,
    conversation,
  });
}