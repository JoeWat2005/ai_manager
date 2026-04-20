import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { getOrCreateLinkProfile } from "@/lib/dashboard/org-resources";
import { prisma } from "@/lib/prisma";

type LinksBody =
  | {
      action: "updateProfile";
      title?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      accentColor?: string;
      buttonStyle?: string;
      showBranding?: boolean;
    }
  | {
      action: "createItem";
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

export async function GET() {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const profile = await getOrCreateLinkProfile(
    access.organization.id,
    `${access.organization.name} links`
  );

  return Response.json({ ok: true, profile });
}

export async function POST(req: Request) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  let body: LinksBody;
  try {
    body = (await req.json()) as LinksBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const profile = await getOrCreateLinkProfile(
    access.organization.id,
    `${access.organization.name} links`
  );

  if (body.action === "updateProfile") {
    const updated = await prisma.organizationLinkProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        title: body.title?.trim() || profile.title,
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
        accentColor: body.accentColor?.trim() || profile.accentColor,
        buttonStyle: body.buttonStyle?.trim() || profile.buttonStyle,
        showBranding:
          typeof body.showBranding === "boolean"
            ? body.showBranding
            : profile.showBranding,
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

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

  if (body.action === "createItem") {
    const label = body.label?.trim();
    const url = body.url?.trim();

    if (!label || !url) {
      return Response.json(
        { ok: false, error: "label and url are required" },
        { status: 400 }
      );
    }

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

    const item = await prisma.organizationLinkItem.create({
      data: {
        profileId: profile.id,
        label,
        url,
        visible: typeof body.visible === "boolean" ? body.visible : true,
        platform: body.platform ?? "custom",
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
    });

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

  return Response.json({ ok: false, error: "Invalid links action" }, { status: 400 });
}
