// Import access guard (ensures user is authenticated + belongs to an organization)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import audit logging helper (tracks changes)
import { createAuditLog } from "@/lib/dashboard/events";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define expected request body for updating a link item
type LinkItemPatchBody = {
  label?: string;     // display text for the link
  url?: string;       // destination URL
  visible?: boolean;  // whether link is shown publicly
  sortOrder?: number; // ordering position
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

// =====================
// PATCH: Update link item
// =====================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // dynamic route: /api/links/[id]
) {
  // Ensure user is authenticated and has org access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Extract link item ID from route
  const { id } = await params;

  // Parse JSON body safely
  let body: LinkItemPatchBody;
  try {
    body = (await req.json()) as LinkItemPatchBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Find the link item and ensure it belongs to this organization
  const item = await prisma.organizationLinkItem.findFirst({
    where: {
      id,

      // Important: check via related profile → organization
      profile: {
        organizationId: access.organization.id,
      },
    },
  });

  // If not found → return 404
  if (!item) {
    return Response.json(
      { ok: false, error: "Link item not found" },
      { status: 404 }
    );
  }

  // Update the link item
  const updated = await prisma.organizationLinkItem.update({
    where: { id: item.id },

    data: {
      // Update label if provided
      label:
        typeof body.label === "string"
          ? body.label.trim()
          : item.label,

      // Update URL if provided
      url:
        typeof body.url === "string"
          ? body.url.trim()
          : item.url,

      // Update visibility only if explicitly provided
      visible:
        typeof body.visible === "boolean"
          ? body.visible
          : item.visible,

      // Validate and normalize sort order:
      // - must be a number
      // - round down
      // - minimum = 0
      sortOrder:
        typeof body.sortOrder === "number" &&
        Number.isFinite(body.sortOrder)
          ? Math.max(0, Math.floor(body.sortOrder))
          : item.sortOrder,

      // Update platform if provided (simple fallback)
      platform: body.platform ?? item.platform,
    },
  });

  // Log the update action
  await createAuditLog({
    organizationId: access.organization.id,
    action: "link_updated",
    actorUserId: access.userId,
    description: `Updated link item ${updated.label}`,
    targetType: "link-item",
    targetId: updated.id,
  });

  // Return updated item
  return Response.json({
    ok: true,
    item: updated,
  });
}

// =====================
// DELETE: Remove link item
// =====================
export async function DELETE(
  _req: Request, // unused request object
  { params }: { params: Promise<{ id: string }> }
) {
  // Ensure user is authenticated and has org access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Extract ID from route
  const { id } = await params;

  // Find item (with org ownership check)
  const item = await prisma.organizationLinkItem.findFirst({
    where: {
      id,
      profile: {
        organizationId: access.organization.id,
      },
    },
  });

  // If not found → 404
  if (!item) {
    return Response.json(
      { ok: false, error: "Link item not found" },
      { status: 404 }
    );
  }

  // Delete the item from database
  await prisma.organizationLinkItem.delete({
    where: { id: item.id },
  });

  // Log deletion
  await createAuditLog({
    organizationId: access.organization.id,
    action: "link_deleted",
    actorUserId: access.userId,
    description: `Deleted link item ${item.label}`,
    targetType: "link-item",
    targetId: item.id,
  });

  // Return success
  return Response.json({ ok: true });
}