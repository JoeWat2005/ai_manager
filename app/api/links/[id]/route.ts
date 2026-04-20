import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { prisma } from "@/lib/prisma";

type LinkItemPatchBody = {
  label?: string;
  url?: string;
  visible?: boolean;
  sortOrder?: number;
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
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const { id } = await params;

  let body: LinkItemPatchBody;
  try {
    body = (await req.json()) as LinkItemPatchBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const item = await prisma.organizationLinkItem.findFirst({
    where: {
      id,
      profile: {
        organizationId: access.organization.id,
      },
    },
  });

  if (!item) {
    return Response.json({ ok: false, error: "Link item not found" }, { status: 404 });
  }

  const updated = await prisma.organizationLinkItem.update({
    where: { id: item.id },
    data: {
      label: typeof body.label === "string" ? body.label.trim() : item.label,
      url: typeof body.url === "string" ? body.url.trim() : item.url,
      visible: typeof body.visible === "boolean" ? body.visible : item.visible,
      sortOrder:
        typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
          ? Math.max(0, Math.floor(body.sortOrder))
          : item.sortOrder,
      platform: body.platform ?? item.platform,
    },
  });

  await createAuditLog({
    organizationId: access.organization.id,
    action: "link_updated",
    actorUserId: access.userId,
    description: `Updated link item ${updated.label}`,
    targetType: "link-item",
    targetId: updated.id,
  });

  return Response.json({ ok: true, item: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const { id } = await params;

  const item = await prisma.organizationLinkItem.findFirst({
    where: {
      id,
      profile: {
        organizationId: access.organization.id,
      },
    },
  });

  if (!item) {
    return Response.json({ ok: false, error: "Link item not found" }, { status: 404 });
  }

  await prisma.organizationLinkItem.delete({
    where: { id: item.id },
  });

  await createAuditLog({
    organizationId: access.organization.id,
    action: "link_deleted",
    actorUserId: access.userId,
    description: `Deleted link item ${item.label}`,
    targetType: "link-item",
    targetId: item.id,
  });

  return Response.json({ ok: true });
}
