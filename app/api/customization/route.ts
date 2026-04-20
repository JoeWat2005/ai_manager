import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { getOrCreatePageCustomization } from "@/lib/dashboard/org-resources";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const customization = await getOrCreatePageCustomization(
    access.organization.id,
    access.organization.name
  );

  return Response.json({ ok: true, customization });
}

export async function POST(req: Request) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  let body: CustomizationBody;
  try {
    body = (await req.json()) as CustomizationBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const current = await getOrCreatePageCustomization(
    access.organization.id,
    access.organization.name
  );

  const updated = await prisma.organizationPageCustomization.update({
    where: {
      organizationId: access.organization.id,
    },
    data: {
      landingHeroTitle: body.landingHeroTitle?.trim() || current.landingHeroTitle,
      landingHeroSubtitle:
        body.landingHeroSubtitle?.trim() || current.landingHeroSubtitle,
      landingPrimaryCtaLabel:
        body.landingPrimaryCtaLabel?.trim() || current.landingPrimaryCtaLabel,
      landingSecondaryCtaLabel:
        body.landingSecondaryCtaLabel?.trim() || current.landingSecondaryCtaLabel,
      landingShowBookingForm:
        typeof body.landingShowBookingForm === "boolean"
          ? body.landingShowBookingForm
          : current.landingShowBookingForm,
      landingShowChatWidget:
        typeof body.landingShowChatWidget === "boolean"
          ? body.landingShowChatWidget
          : current.landingShowChatWidget,
      landingAccentColor: body.landingAccentColor?.trim() || current.landingAccentColor,
      linksTitle: body.linksTitle?.trim() || current.linksTitle,
      linksBio:
        body.linksBio === null
          ? null
          : typeof body.linksBio === "string"
            ? body.linksBio.trim()
            : current.linksBio,
      linksAccentColor: body.linksAccentColor?.trim() || current.linksAccentColor,
      linksButtonStyle: body.linksButtonStyle?.trim() || current.linksButtonStyle,
    },
  });

  await createAuditLog({
    organizationId: access.organization.id,
    action: "customization_updated",
    actorUserId: access.userId,
    description: "Updated landing/links customization settings",
    targetType: "customization",
    targetId: updated.id,
  });

  return Response.json({ ok: true, customization: updated });
}
