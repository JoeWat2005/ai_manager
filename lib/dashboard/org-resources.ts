import { prisma } from "@/lib/prisma";

export async function getOrCreateLinkProfile(organizationId: string, fallbackTitle: string) {
  const existing = await prisma.organizationLinkProfile.findUnique({
    where: { organizationId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.organizationLinkProfile.create({
    data: {
      organizationId,
      title: fallbackTitle,
      bio: "Find our latest updates, booking links, and socials.",
      accentColor: "#2563eb",
      buttonStyle: "solid",
      showBranding: true,
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getOrCreatePageCustomization(
  organizationId: string,
  businessName: string
) {
  const existing = await prisma.organizationPageCustomization.findUnique({
    where: { organizationId },
  });

  if (existing) {
    return existing;
  }

  return prisma.organizationPageCustomization.create({
    data: {
      organizationId,
      landingHeroTitle: `${businessName} front desk, powered by Deskcaptain`,
      landingHeroSubtitle:
        "Book appointments or chat with our AI receptionist for faster responses.",
      landingPrimaryCtaLabel: "Book now",
      landingSecondaryCtaLabel: "Start AI chat",
      landingShowBookingForm: true,
      landingShowChatWidget: true,
      landingAccentColor: "#2563eb",
      linksTitle: `${businessName} links`,
      linksBio: "All of our official links in one place.",
      linksAccentColor: "#2563eb",
      linksButtonStyle: "solid",
    },
  });
}
