// Import access guard (auth + organization check)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import audit logging helper
import { createAuditLog } from "@/lib/dashboard/events";

// Import helper that ensures a link profile exists (creates default if needed)
import { getOrCreateLinkProfile } from "@/lib/dashboard/org-resources";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define request body types (two possible shapes)
// This is called a "discriminated union" using `action`
type LinksBody =
  | {
      action: "updateProfile"; // update profile settings
      title?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      accentColor?: string;
      buttonStyle?: string;
      showBranding?: boolean;
    }
  | {
      action: "createItem"; // create a new link item
      platform?:
        | "custom"
        | "website"
        | "linkedin"
        | "instagram"
        | "facebook"
        | "x"
        | "youtube"
        | "tiktok"
        | "whatsapp";
      label?: string;
      url?: string;
      visible?: boolean;
    };

// =====================
// GET: Fetch link profile + items
// =====================
export async function GET() {
  // Ensure user is authenticated + belongs to org
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Get or create link profile for this org
  const profile = await getOrCreateLinkProfile(
    access.organization.id,
    `${access.organization.name} links`
  );

  // Return profile (likely includes items)
  return Response.json({ ok: true, profile });
}

// =====================
// POST: Multiple actions
// =====================
export async function POST(req: Request) {
  // Check auth
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Parse JSON safely
  let body: LinksBody;
  try {
    body = (await req.json()) as LinksBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Ensure profile exists
  const profile = await getOrCreateLinkProfile(
    access.organization.id,
    `${access.organization.name} links`
  );

  // =====================
  // ACTION: updateProfile
  // =====================
  if (body.action === "updateProfile") {
    const updated = await prisma.organizationLinkProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        // Text fields: trim + fallback
        title: body.title?.trim() || profile.title,

        // Special null handling:
        // - null → clear value
        // - string → trim
        // - undefined → keep existing
        bio:
          body.bio === null
            ? null
            : typeof body.bio === "string"
              ? body.bio.trim()
              : profile.bio,

        avatarUrl:
          body.avatarUrl === null
            ? null
            : typeof body.avatarUrl === "string"
              ? body.avatarUrl.trim()
              : profile.avatarUrl,

        // Simple string fields
        accentColor: body.accentColor?.trim() || profile.accentColor,
        buttonStyle: body.buttonStyle?.trim() || profile.buttonStyle,

        // Boolean update (only if explicitly provided)
        showBranding:
          typeof body.showBranding === "boolean"
            ? body.showBranding
            : profile.showBranding,
      },

      // Include link items in response
      include: {
        items: {
          orderBy: { sortOrder: "asc" }, // sorted list
        },
      },
    });

    // Log profile update
    await createAuditLog({
      organizationId: access.organization.id,
      action: "link_updated",
      actorUserId: access.userId,
      description: "Updated links profile",
      targetType: "links-profile",
      targetId: updated.id,
    });

    return Response.json({ ok: true, profile: updated });
  }

  // =====================
  // ACTION: createItem
  // =====================
  if (body.action === "createItem") {
    const label = body.label?.trim();
    const url = body.url?.trim();

    // Validate required fields
    if (!label || !url) {
      return Response.json(
        { ok: false, error: "label and url are required" },
        { status: 400 }
      );
    }

    // Find current max sort order
    const maxSortOrder = await prisma.organizationLinkItem.findFirst({
      where: {
        profileId: profile.id,
      },
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });

    // Create new link item
    const item = await prisma.organizationLinkItem.create({
      data: {
        profileId: profile.id,
        label,
        url,

        // Default visible = true if not provided
        visible: typeof body.visible === "boolean" ? body.visible : true,

        // Default platform = "custom"
        platform: body.platform ?? "custom",

        // Place item at end of list
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
    });

    // Log creation
    await createAuditLog({
      organizationId: access.organization.id,
      action: "link_created",
      actorUserId: access.userId,
      description: `Added link item ${label}`,
      targetType: "link-item",
      targetId: item.id,
    });

    return Response.json({ ok: true, item });
  }

  // If action is invalid → error
  return Response.json(
    { ok: false, error: "Invalid links action" },
    { status: 400 }
  );
}
