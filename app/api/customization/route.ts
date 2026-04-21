// Import access guard (ensures user is authenticated and belongs to an organization)
import { requireDashboardApiOrg } from "@/lib/dashboard/access";

// Import audit logging helper (tracks changes)
import { createAuditLog } from "@/lib/dashboard/events";

// Import helper that ensures customization exists (creates defaults if missing)
import { getOrCreatePageCustomization } from "@/lib/dashboard/org-resources";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define expected request body for updating page customization
type CustomizationBody = {
  landingHeroTitle?: string;
  landingHeroSubtitle?: string;
  landingPrimaryCtaLabel?: string;
  landingSecondaryCtaLabel?: string;
  landingShowBookingForm?: boolean;
  landingShowChatWidget?: boolean;
  landingAccentColor?: string;
  linksTitle?: string;
  linksBio?: string | null;
  linksAccentColor?: string;
  linksButtonStyle?: string;
};

// =====================
// GET: Fetch customization
// =====================
export async function GET() {
  // Ensure user is authenticated and has org access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Get existing customization OR create defaults if missing
  const customization = await getOrCreatePageCustomization(
    access.organization.id,
    access.organization.name
  );

  // Return customization data
  return Response.json({ ok: true, customization });
}

// =====================
// POST: Update customization
// =====================
export async function POST(req: Request) {
  // Ensure user is authenticated and has org access
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  // Parse JSON body safely
  let body: CustomizationBody;
  try {
    body = (await req.json()) as CustomizationBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Load current customization (used as fallback values)
  const current = await getOrCreatePageCustomization(
    access.organization.id,
    access.organization.name
  );

  // Update customization in database
  const updated = await prisma.organizationPageCustomization.update({
    where: {
      // Each organization has one customization record
      organizationId: access.organization.id,
    },
    data: {
      // For text fields:
      // - trim whitespace
      // - fallback to existing value if not provided
      landingHeroTitle:
        body.landingHeroTitle?.trim() || current.landingHeroTitle,

      landingHeroSubtitle:
        body.landingHeroSubtitle?.trim() || current.landingHeroSubtitle,

      landingPrimaryCtaLabel:
        body.landingPrimaryCtaLabel?.trim() ||
        current.landingPrimaryCtaLabel,

      landingSecondaryCtaLabel:
        body.landingSecondaryCtaLabel?.trim() ||
        current.landingSecondaryCtaLabel,

      // For booleans:
      // only update if explicitly provided
      landingShowBookingForm:
        typeof body.landingShowBookingForm === "boolean"
          ? body.landingShowBookingForm
          : current.landingShowBookingForm,

      landingShowChatWidget:
        typeof body.landingShowChatWidget === "boolean"
          ? body.landingShowChatWidget
          : current.landingShowChatWidget,

      // Colors (strings with trimming + fallback)
      landingAccentColor:
        body.landingAccentColor?.trim() || current.landingAccentColor,

      // Links page fields
      linksTitle: body.linksTitle?.trim() || current.linksTitle,

      // Special handling:
      // - allow explicit null (to clear value)
      // - trim if string
      // - fallback otherwise
      linksBio:
        body.linksBio === null
          ? null
          : typeof body.linksBio === "string"
            ? body.linksBio.trim()
            : current.linksBio,

      linksAccentColor:
        body.linksAccentColor?.trim() || current.linksAccentColor,

      linksButtonStyle:
        body.linksButtonStyle?.trim() || current.linksButtonStyle,
    },
  });

  // Log the update (audit trail)
  await createAuditLog({
    organizationId: access.organization.id,
    action: "customization_updated",
    actorUserId: access.userId,
    description: "Updated landing/links customization settings",
    targetType: "customization",
    targetId: updated.id,
  });

  // Return updated customization
  return Response.json({
    ok: true,
    customization: updated,
  });
}
