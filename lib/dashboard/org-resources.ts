import { prisma } from "@/lib/prisma";

// --- LINK PROFILE (like a "link in bio" page) ---

export async function getOrCreateLinkProfile(
  organizationId: string,
  fallbackTitle: string
) {
  // Try to fetch existing profile
  const existing = await prisma.organizationLinkProfile.findUnique({
    where: { organizationId },

    // Also load all link items (sorted)
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // If it already exists → return it
  if (existing) {
    return existing;
  }

  // Otherwise → create a default profile
  return prisma.organizationLinkProfile.create({
    data: {
      organizationId,

      // Default UI values
      title: fallbackTitle,
      bio: "Find our latest updates, booking links, and socials.",
      accentColor: "#2563eb",
      buttonStyle: "solid",
      showBranding: true,
    },

    // Return with items (empty initially)
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

// --- LANDING PAGE CUSTOMIZATION ---

export async function getOrCreatePageCustomization(
  organizationId: string,
  businessName: string
) {
  // Try to fetch existing customization settings
  const existing = await prisma.organizationPageCustomization.findUnique({
    where: { organizationId },
  });

  // If found → return it
  if (existing) {
    return existing;
  }

  // Otherwise → create defaults
  return prisma.organizationPageCustomization.create({
    data: {
      organizationId,

      // --- Landing page content ---
      landingHeroTitle: `${businessName} front desk, powered by Deskcaptain`,

      landingHeroSubtitle:
        "Book appointments or chat with our AI receptionist for faster responses.",

      // CTA buttons
      landingPrimaryCtaLabel: "Book now",
      landingSecondaryCtaLabel: "Start AI chat",

      // Feature toggles
      landingShowBookingForm: true,
      landingShowChatWidget: true,

      // Styling
      landingAccentColor: "#2563eb",

      // --- Link page settings ---
      linksTitle: `${businessName} links`,
      linksBio: "All of our official links in one place.",
      linksAccentColor: "#2563eb",
      linksButtonStyle: "solid",
    },
  });
}