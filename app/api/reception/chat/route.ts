// Import main chat handler (likely calls OpenAI / AI logic)
import { handleChatTurn } from "@/lib/reception/chat";

// Default empty lead data (used to collect user info gradually)
import { EMPTY_LEAD_DRAFT } from "@/lib/reception/defaults";

// Helpers to fetch org + receptionist config
import {
  getOrCreateReceptionistConfig,
  getOrganizationBySlug,
} from "@/lib/reception/org";

// Type for lead data being built during chat
import { LeadDraft } from "@/lib/reception/types";

// Expected request body
type ChatRequestBody = {
  slug?: string;       // public org identifier
  message?: string;    // user's current message
  sessionId?: string;  // unique chat session ID
  history?: Array<{    // previous messages
    role?: "user" | "assistant";
    content?: string;
  }>;
  draft?: Partial<LeadDraft>; // partial collected user info
};

// Handle POST request (chat message)
export async function POST(req: Request) {
  let body: ChatRequestBody;

  // Parse JSON safely
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Clean inputs
  const slug = body.slug?.trim();
  const message = body.message?.trim();
  const sessionId = body.sessionId?.trim();

  // Ensure history is an array
  const history = Array.isArray(body.history) ? body.history : [];

  // Default draft object
  const draft = body.draft ?? {};

  // Validate required fields
  if (!slug || !message || !sessionId) {
    return Response.json(
      { ok: false, error: "slug, message, and sessionId are required" },
      { status: 400 }
    );
  }

  // Find organization by slug (public access)
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return Response.json(
      { ok: false, error: "Organization not found" },
      { status: 404 }
    );
  }

  // Paid plan check (feature gating)
  if (!organization.hasPaidPlan) {
    return Response.json(
      {
        ok: false,
        error: "AI receptionist is currently available on paid plans only.",
      },
      { status: 403 }
    );
  }

  // Load or create AI receptionist config for this org
  const config = await getOrCreateReceptionistConfig(
    organization.id,
    "missing-email@deskcaptain.local"
  );

  // Feature toggle: chat must be enabled
  if (!config.chatEnabled) {
    return Response.json(
      { ok: false, error: "Web receptionist is disabled for this organization." },
      { status: 403 }
    );
  }

  try {
    // Clean and limit chat history
    const sanitizedHistory = history
      .filter(
        (entry) =>
          (entry.role === "user" || entry.role === "assistant") &&
          typeof entry.content === "string" &&
          entry.content.trim().length > 0
      )
      .map((entry) => ({
        role: entry.role as "user" | "assistant",
        content: (entry.content as string).trim(),
      }))
      .slice(-10); // keep only last 10 messages

    // Call AI chat logic
    const result = await handleChatTurn({
      organizationId: organization.id,
      organizationName: organization.name,
      notificationEmail: config.notificationEmail,
      faqScript: config.faqScript,
      businessHoursJson: config.businessHoursJson,
      timezone: config.timezone,
      sessionId,
      message,
      history: sanitizedHistory,

      // Merge default draft with incoming data
      draft: {
        ...EMPTY_LEAD_DRAFT,
        ...draft,
      },
    });

    // Return AI response
    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    // Log internal error
    const messageText =
      error instanceof Error ? error.message : "Unknown chat error";

    console.error("[Reception chat] OpenAI chat failed", {
      slug: organization.slug,
      error: messageText,
    });

    // Return safe user-facing error
    return Response.json(
      {
        ok: false,
        error:
          "AI receptionist is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 }
    );
  }
}