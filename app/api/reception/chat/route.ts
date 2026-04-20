import { handleChatTurn } from "@/lib/reception/chat";
import { EMPTY_LEAD_DRAFT } from "@/lib/reception/defaults";
import { getOrCreateReceptionistConfig, getOrganizationBySlug } from "@/lib/reception/org";
import { LeadDraft } from "@/lib/reception/types";

type ChatRequestBody = {
  slug?: string;
  message?: string;
  sessionId?: string;
  history?: Array<{
    role?: "user" | "assistant";
    content?: string;
  }>;
  draft?: Partial<LeadDraft>;
};

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const message = body.message?.trim();
  const sessionId = body.sessionId?.trim();
  const history = Array.isArray(body.history) ? body.history : [];
  const draft = body.draft ?? {};

  if (!slug || !message || !sessionId) {
    return Response.json(
      {
        ok: false,
        error: "slug, message, and sessionId are required",
      },
      { status: 400 }
    );
  }

  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    return Response.json({ ok: false, error: "Organization not found" }, { status: 404 });
  }

  if (!organization.hasPaidPlan) {
    return Response.json(
      {
        ok: false,
        error: "AI receptionist is currently available on paid plans only.",
      },
      { status: 403 }
    );
  }

  const config = await getOrCreateReceptionistConfig(
    organization.id,
    "missing-email@deskcaptain.local"
  );

  if (!config.chatEnabled) {
    return Response.json(
      { ok: false, error: "Web receptionist is disabled for this organization." },
      { status: 403 }
    );
  }

  try {
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
      .slice(-10);

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
      draft: {
        ...EMPTY_LEAD_DRAFT,
        ...draft,
      },
    });

    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown chat error";
    console.error("[Reception chat] OpenAI chat failed", {
      slug: organization.slug,
      error: messageText,
    });
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
