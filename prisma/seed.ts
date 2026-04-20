import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AuditActionType,
  BookingSource,
  BookingStatus,
  ConversationMessageRole,
  LinkPlatform,
  NotificationEventType,
  NotificationStatus,
  PrismaClient,
  ReceptionChannel,
  ReceptionLeadStatus,
} from "../generated/prisma/client";

const DEFAULT_ORG_ID = "cmo7go9d800004wgdcuu9n5o6";
const SEED_PREFIX = "seed-demo";
const DEFAULT_TIMEZONE = process.env.RECEPTION_DEFAULT_TIMEZONE ?? "Europe/London";

const DEFAULT_BUSINESS_HOURS = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: true, start: "10:00", end: "14:00" },
  sunday: { enabled: false, start: "10:00", end: "14:00" },
} as const;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  }),
});

type SeedStaff = {
  id: string;
  displayName: string;
  email: string;
  timezone: string;
  priority: number;
};

type SeedContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

function seedId(...parts: string[]) {
  return [SEED_PREFIX, ...parts].join("-");
}

function parseOrgIdFromArgs() {
  const args = process.argv.slice(2);
  const explicitFlag = args.find((arg) => arg.startsWith("--orgId="));
  if (explicitFlag) {
    return explicitFlag.slice("--orgId=".length);
  }

  const flagIndex = args.findIndex((arg) => arg === "--orgId");
  if (flagIndex >= 0) {
    return args[flagIndex + 1];
  }

  const firstPositional = args.find((arg) => !arg.startsWith("--"));
  return firstPositional;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function generateUniquePhoneExtension(organizationId: string) {
  const existing = await prisma.receptionistConfig.findUnique({
    where: { organizationId },
    select: { phoneExtension: true },
  });

  if (existing?.phoneExtension) {
    return existing.phoneExtension;
  }

  for (let index = 0; index < 200; index += 1) {
    const candidate = String((hashString(`${organizationId}:${index}`) % 9000) + 1000);
    const conflict = await prisma.receptionistConfig.findFirst({
      where: { phoneExtension: candidate },
      select: { id: true },
    });

    if (!conflict) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique phone extension for seeded receptionist config.");
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function atLocalTime(dayOffset: number, hour: number, minute = 0) {
  const date = new Date();
  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setMinutes(minute);
  date.setHours(hour);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function createSeedContacts(slug: string): SeedContact[] {
  return [
    {
      id: seedId("contact", "sarah"),
      name: "Sarah Mitchell",
      email: `sarah@${slug}.example`,
      phone: "+447700900101",
    },
    {
      id: seedId("contact", "james"),
      name: "James Carter",
      email: `james@${slug}.example`,
      phone: "+447700900102",
    },
    {
      id: seedId("contact", "priya"),
      name: "Priya Shah",
      email: `priya@${slug}.example`,
      phone: "+447700900103",
    },
    {
      id: seedId("contact", "lewis"),
      name: "Lewis Bennett",
      email: `lewis@${slug}.example`,
      phone: "+447700900104",
    },
    {
      id: seedId("contact", "hannah"),
      name: "Hannah Doyle",
      email: `hannah@${slug}.example`,
      phone: "+447700900105",
    },
  ];
}

function createSeedStaff(slug: string): SeedStaff[] {
  return [
    {
      id: seedId("staff", "maya"),
      displayName: "Maya Thompson",
      email: `maya@${slug}.example`,
      timezone: DEFAULT_TIMEZONE,
      priority: 0,
    },
    {
      id: seedId("staff", "daniel"),
      displayName: "Daniel Reid",
      email: `daniel@${slug}.example`,
      timezone: DEFAULT_TIMEZONE,
      priority: 1,
    },
  ];
}

function createSeedAvailabilities(staff: SeedStaff[]) {
  return [
    {
      id: seedId("availability", "maya", "mon"),
      staffProfileId: staff[0].id,
      weekday: 1,
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "maya", "tue"),
      staffProfileId: staff[0].id,
      weekday: 2,
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "maya", "wed"),
      staffProfileId: staff[0].id,
      weekday: 3,
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "maya", "thu"),
      staffProfileId: staff[0].id,
      weekday: 4,
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "maya", "fri"),
      staffProfileId: staff[0].id,
      weekday: 5,
      startMinutes: 9 * 60,
      endMinutes: 17 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "daniel", "mon"),
      staffProfileId: staff[1].id,
      weekday: 1,
      startMinutes: 10 * 60,
      endMinutes: 18 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "daniel", "tue"),
      staffProfileId: staff[1].id,
      weekday: 2,
      startMinutes: 10 * 60,
      endMinutes: 18 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "daniel", "wed"),
      staffProfileId: staff[1].id,
      weekday: 3,
      startMinutes: 10 * 60,
      endMinutes: 18 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "daniel", "thu"),
      staffProfileId: staff[1].id,
      weekday: 4,
      startMinutes: 10 * 60,
      endMinutes: 18 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "daniel", "fri"),
      staffProfileId: staff[1].id,
      weekday: 5,
      startMinutes: 10 * 60,
      endMinutes: 18 * 60,
      isEnabled: true,
    },
    {
      id: seedId("availability", "daniel", "sat"),
      staffProfileId: staff[1].id,
      weekday: 6,
      startMinutes: 10 * 60,
      endMinutes: 14 * 60,
      isEnabled: true,
    },
  ];
}

async function ensureOneToOneRecords(input: {
  organizationId: string;
  organizationName: string;
  slug: string;
  fallbackEmail: string;
}) {
  const extension = await generateUniquePhoneExtension(input.organizationId);

  await prisma.receptionistConfig.upsert({
    where: { organizationId: input.organizationId },
    update: {},
    create: {
      organizationId: input.organizationId,
      phoneExtension: extension,
      notificationEmail: input.fallbackEmail,
      businessHoursJson: DEFAULT_BUSINESS_HOURS,
      faqScript:
        "You are Deskcaptain, a polished AI receptionist. Collect contact details, qualify intent, and offer the next appropriate action without overpromising.",
      transferPhone: "+442080000123",
      phoneEnabled: true,
      chatEnabled: true,
      timezone: DEFAULT_TIMEZONE,
    },
  });

  await prisma.bookingSettings.upsert({
    where: { organizationId: input.organizationId },
    update: {},
    create: {
      organizationId: input.organizationId,
      timezone: DEFAULT_TIMEZONE,
      slotLengthMinutes: 30,
      openingHoursJson: DEFAULT_BUSINESS_HOURS,
      instantConfirm: true,
      autoAssign: true,
    },
  });

  const linkProfile = await prisma.organizationLinkProfile.upsert({
    where: { organizationId: input.organizationId },
    update: {},
    create: {
      organizationId: input.organizationId,
      title: `${input.organizationName} links`,
      bio: "Find booking, social, and contact destinations in one place.",
      accentColor: "#2563eb",
      buttonStyle: "solid",
      showBranding: true,
    },
  });

  await prisma.organizationPageCustomization.upsert({
    where: { organizationId: input.organizationId },
    update: {},
    create: {
      organizationId: input.organizationId,
      landingHeroTitle: `${input.organizationName} front desk, powered by Deskcaptain`,
      landingHeroSubtitle:
        "Book appointments or chat with our AI receptionist for faster responses.",
      landingPrimaryCtaLabel: "Book now",
      landingSecondaryCtaLabel: "Start AI chat",
      landingShowBookingForm: true,
      landingShowChatWidget: true,
      landingAccentColor: "#2563eb",
      linksTitle: `${input.organizationName} links`,
      linksBio: "All of our official links in one place.",
      linksAccentColor: "#2563eb",
      linksButtonStyle: "solid",
    },
  });

  return { linkProfileId: linkProfile.id, phoneExtension: extension };
}

async function clearExistingSeedData(organizationId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.receptionConversationMessage.deleteMany({
      where: { id: { startsWith: SEED_PREFIX } },
    });
    await tx.receptionCallRecording.deleteMany({
      where: { id: { startsWith: SEED_PREFIX } },
    });
    await tx.booking.deleteMany({
      where: {
        organizationId,
        id: { startsWith: SEED_PREFIX },
      },
    });
    await tx.receptionConversation.deleteMany({
      where: {
        organizationId,
        id: { startsWith: SEED_PREFIX },
      },
    });
    await tx.receptionLead.deleteMany({
      where: {
        organizationId,
        id: { startsWith: SEED_PREFIX },
      },
    });
    await tx.organizationLinkItem.deleteMany({
      where: { id: { startsWith: SEED_PREFIX } },
    });
    await tx.notificationEvent.deleteMany({
      where: {
        organizationId,
        id: { startsWith: SEED_PREFIX },
      },
    });
    await tx.auditLog.deleteMany({
      where: {
        organizationId,
        id: { startsWith: SEED_PREFIX },
      },
    });
    await tx.bookableStaffAvailability.deleteMany({
      where: { id: { startsWith: SEED_PREFIX } },
    });
    await tx.bookableStaffProfile.deleteMany({
      where: {
        organizationId,
        id: { startsWith: SEED_PREFIX },
      },
    });
    await tx.organizationContact.deleteMany({
      where: {
        organizationId,
        id: { startsWith: SEED_PREFIX },
      },
    });
  });
}

async function seedOrganization(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      memberships: {
        take: 1,
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  if (!organization) {
    throw new Error(`Organization ${organizationId} was not found.`);
  }

  const fallbackEmail =
    organization.memberships[0]?.user.email ?? `hello@${organization.slug}.example`;

  const { linkProfileId, phoneExtension } = await ensureOneToOneRecords({
    organizationId: organization.id,
    organizationName: organization.name,
    slug: organization.slug,
    fallbackEmail,
  });

  await clearExistingSeedData(organization.id);

  const contacts = createSeedContacts(organization.slug);
  const staff = createSeedStaff(organization.slug);
  const availabilities = createSeedAvailabilities(staff);

  const leadCreatedAt = {
    lead1: hoursAgo(2),
    lead2: hoursAgo(5),
    lead3: hoursAgo(28),
    lead4: hoursAgo(52),
    lead5: hoursAgo(7),
    lead6: hoursAgo(1),
  };

  const bookingOneStart = atLocalTime(1, 10, 0);
  const bookingTwoStart = atLocalTime(2, 14, 30);
  const bookingThreeStart = atLocalTime(-1, 11, 0);
  const bookingFourStart = atLocalTime(3, 16, 0);

  const leads = [
    {
      id: seedId("lead", "1"),
      organizationId: organization.id,
      contactId: contacts[0].id,
      channel: ReceptionChannel.web,
      intent: "Book a new patient consultation",
      preferredCallbackWindow: "Tomorrow morning",
      callbackReason: "Would like the earliest available appointment",
      qualified: true,
      status: ReceptionLeadStatus.new,
      providerConversationId: "seed-web-1",
      transcript: "Visitor requested a consultation and accepted a follow-up call.",
      metadataJson: { seeded: true, source: "web-chat" },
      createdAt: leadCreatedAt.lead1,
    },
    {
      id: seedId("lead", "2"),
      organizationId: organization.id,
      contactId: contacts[1].id,
      channel: ReceptionChannel.phone,
      intent: "Ask about pricing for monthly support",
      preferredCallbackWindow: "Today after 4pm",
      callbackReason: "Needs pricing for management sign-off",
      qualified: true,
      status: ReceptionLeadStatus.contacted,
      providerConversationId: "seed-phone-2",
      transcript: "Caller asked about pricing and requested a callback later today.",
      metadataJson: { seeded: true, source: "phone" },
      createdAt: leadCreatedAt.lead2,
    },
    {
      id: seedId("lead", "3"),
      organizationId: organization.id,
      contactId: contacts[2].id,
      channel: ReceptionChannel.web,
      intent: "Check if evening appointments are available",
      preferredCallbackWindow: null,
      callbackReason: null,
      qualified: false,
      status: ReceptionLeadStatus.new,
      providerConversationId: "seed-web-3",
      transcript: "Prospect only wanted evening availability information.",
      metadataJson: { seeded: true, source: "web-chat" },
      createdAt: leadCreatedAt.lead3,
    },
    {
      id: seedId("lead", "4"),
      organizationId: organization.id,
      contactId: contacts[3].id,
      channel: ReceptionChannel.phone,
      intent: "Reschedule existing appointment",
      preferredCallbackWindow: "Tomorrow before lunch",
      callbackReason: "Conflict with current slot",
      qualified: true,
      status: ReceptionLeadStatus.closed,
      providerConversationId: "seed-phone-4",
      transcript: "Caller rescheduled and confirmed details over the phone.",
      metadataJson: { seeded: true, source: "phone" },
      createdAt: leadCreatedAt.lead4,
    },
    {
      id: seedId("lead", "5"),
      organizationId: organization.id,
      contactId: contacts[4].id,
      channel: ReceptionChannel.web,
      intent: "Discuss enterprise onboarding",
      preferredCallbackWindow: "Friday afternoon",
      callbackReason: "Wants to compare service tiers",
      qualified: true,
      status: ReceptionLeadStatus.new,
      providerConversationId: "seed-web-5",
      transcript: "Prospect wants onboarding support and a tailored package.",
      metadataJson: { seeded: true, source: "web-chat" },
      createdAt: leadCreatedAt.lead5,
    },
    {
      id: seedId("lead", "6"),
      organizationId: organization.id,
      contactId: contacts[0].id,
      channel: ReceptionChannel.phone,
      intent: "Request urgent same-day callback",
      preferredCallbackWindow: "Within the hour",
      callbackReason: "Needs urgent confirmation before visiting",
      qualified: true,
      status: ReceptionLeadStatus.new,
      providerConversationId: "seed-phone-6",
      transcript: "Urgent inbound caller requested a same-day callback.",
      metadataJson: { seeded: true, source: "phone" },
      createdAt: leadCreatedAt.lead6,
    },
  ];

  const conversations = [
    {
      id: seedId("conversation", "1"),
      organizationId: organization.id,
      leadId: leads[0].id,
      channel: ReceptionChannel.web,
      provider: "openai",
      providerConversationId: "seed-conversation-web-1",
      outcome: "booked",
      startedAt: hoursAgo(2.2),
      endedAt: hoursAgo(2),
      metadataJson: { seeded: true, widget: "landing" },
      createdAt: leadCreatedAt.lead1,
    },
    {
      id: seedId("conversation", "2"),
      organizationId: organization.id,
      leadId: leads[1].id,
      channel: ReceptionChannel.phone,
      provider: "vapi",
      providerConversationId: "seed-conversation-phone-2",
      outcome: "qualified",
      startedAt: hoursAgo(5.2),
      endedAt: hoursAgo(5),
      metadataJson: { seeded: true, widget: "phone" },
      createdAt: leadCreatedAt.lead2,
    },
    {
      id: seedId("conversation", "3"),
      organizationId: organization.id,
      leadId: leads[2].id,
      channel: ReceptionChannel.web,
      provider: "openai",
      providerConversationId: "seed-conversation-web-3",
      outcome: "faq_resolved",
      startedAt: hoursAgo(28.3),
      endedAt: hoursAgo(28),
      metadataJson: { seeded: true, widget: "landing" },
      createdAt: leadCreatedAt.lead3,
    },
    {
      id: seedId("conversation", "4"),
      organizationId: organization.id,
      leadId: leads[3].id,
      channel: ReceptionChannel.phone,
      provider: "vapi",
      providerConversationId: "seed-conversation-phone-4",
      outcome: "callback_requested",
      startedAt: hoursAgo(52.2),
      endedAt: hoursAgo(52),
      metadataJson: { seeded: true, widget: "phone" },
      createdAt: leadCreatedAt.lead4,
    },
    {
      id: seedId("conversation", "5"),
      organizationId: organization.id,
      leadId: leads[4].id,
      channel: ReceptionChannel.web,
      provider: "openai",
      providerConversationId: "seed-conversation-web-5",
      outcome: "qualified",
      startedAt: hoursAgo(7.5),
      endedAt: hoursAgo(7.1),
      metadataJson: { seeded: true, widget: "landing" },
      createdAt: leadCreatedAt.lead5,
    },
    {
      id: seedId("conversation", "6"),
      organizationId: organization.id,
      leadId: leads[5].id,
      channel: ReceptionChannel.phone,
      provider: "vapi",
      providerConversationId: "seed-conversation-phone-6",
      outcome: "urgent_callback",
      startedAt: hoursAgo(1.2),
      endedAt: hoursAgo(1),
      metadataJson: { seeded: true, widget: "phone" },
      createdAt: leadCreatedAt.lead6,
    },
  ];

  const messages = [
    {
      id: seedId("message", "1"),
      conversationId: conversations[0].id,
      role: ConversationMessageRole.assistant,
      content: `Welcome to ${organization.name}. How can I help today?`,
      createdAt: hoursAgo(2.2),
    },
    {
      id: seedId("message", "2"),
      conversationId: conversations[0].id,
      role: ConversationMessageRole.user,
      content: "I want to book a consultation for next week.",
      createdAt: hoursAgo(2.18),
    },
    {
      id: seedId("message", "3"),
      conversationId: conversations[0].id,
      role: ConversationMessageRole.assistant,
      content: "Absolutely. Can I take your phone number and preferred callback window?",
      createdAt: hoursAgo(2.16),
    },
    {
      id: seedId("message", "4"),
      conversationId: conversations[0].id,
      role: ConversationMessageRole.user,
      content: "Tomorrow morning is perfect. My number is +44 7700 900101.",
      createdAt: hoursAgo(2.14),
    },
    {
      id: seedId("message", "5"),
      conversationId: conversations[1].id,
      role: ConversationMessageRole.assistant,
      content: "Thanks for calling Deskcaptain. What can we help with today?",
      createdAt: hoursAgo(5.2),
    },
    {
      id: seedId("message", "6"),
      conversationId: conversations[1].id,
      role: ConversationMessageRole.user,
      content: "I need pricing for monthly support before I brief my manager.",
      createdAt: hoursAgo(5.17),
    },
    {
      id: seedId("message", "7"),
      conversationId: conversations[1].id,
      role: ConversationMessageRole.assistant,
      content: "Got it. I can arrange a callback this afternoon so someone can walk you through the options.",
      createdAt: hoursAgo(5.14),
    },
    {
      id: seedId("message", "8"),
      conversationId: conversations[2].id,
      role: ConversationMessageRole.assistant,
      content: "We currently offer appointments from 9am to 5pm on weekdays.",
      createdAt: hoursAgo(28.2),
    },
    {
      id: seedId("message", "9"),
      conversationId: conversations[2].id,
      role: ConversationMessageRole.user,
      content: "Thanks, I only needed to check if evenings were possible.",
      createdAt: hoursAgo(28.1),
    },
    {
      id: seedId("message", "10"),
      conversationId: conversations[3].id,
      role: ConversationMessageRole.assistant,
      content: "I can help reschedule that appointment. What new time works best?",
      createdAt: hoursAgo(52.2),
    },
    {
      id: seedId("message", "11"),
      conversationId: conversations[3].id,
      role: ConversationMessageRole.user,
      content: "Tomorrow morning would be better.",
      createdAt: hoursAgo(52.15),
    },
    {
      id: seedId("message", "12"),
      conversationId: conversations[4].id,
      role: ConversationMessageRole.assistant,
      content: "Happy to help. Are you looking for onboarding support for a team?",
      createdAt: hoursAgo(7.4),
    },
    {
      id: seedId("message", "13"),
      conversationId: conversations[4].id,
      role: ConversationMessageRole.user,
      content: "Yes, we need help onboarding a 12-person team next month.",
      createdAt: hoursAgo(7.32),
    },
    {
      id: seedId("message", "14"),
      conversationId: conversations[5].id,
      role: ConversationMessageRole.assistant,
      content: "I understand this is urgent. I can queue a callback within the hour.",
      createdAt: hoursAgo(1.15),
    },
    {
      id: seedId("message", "15"),
      conversationId: conversations[5].id,
      role: ConversationMessageRole.user,
      content: "Please do, I need confirmation before I travel over.",
      createdAt: hoursAgo(1.1),
    },
  ];

  const recordings = [
    {
      id: seedId("recording", "2"),
      conversationId: conversations[1].id,
      recordingUrl: "https://example.com/recordings/seed-phone-2.mp3",
      storageProvider: "seed-demo",
      durationSeconds: 186,
      transcriptText:
        "Caller requested pricing for monthly support and asked for a callback after 4pm.",
      transcriptSummary:
        "Qualified pricing lead. Requested callback later today for monthly support options.",
      metadataJson: { seeded: true },
    },
    {
      id: seedId("recording", "4"),
      conversationId: conversations[3].id,
      recordingUrl: "https://example.com/recordings/seed-phone-4.mp3",
      storageProvider: "seed-demo",
      durationSeconds: 142,
      transcriptText:
        "Caller needed to reschedule an existing appointment to tomorrow morning.",
      transcriptSummary:
        "Existing customer requested a callback to confirm a rescheduled slot.",
      metadataJson: { seeded: true },
    },
    {
      id: seedId("recording", "6"),
      conversationId: conversations[5].id,
      recordingUrl: "https://example.com/recordings/seed-phone-6.mp3",
      storageProvider: "seed-demo",
      durationSeconds: 94,
      transcriptText:
        "Urgent caller requested confirmation before traveling and asked for a callback within the hour.",
      transcriptSummary:
        "Urgent callback request captured with clear same-day follow-up intent.",
      metadataJson: { seeded: true },
    },
  ];

  const bookings = [
    {
      id: seedId("booking", "1"),
      organizationId: organization.id,
      contactId: contacts[0].id,
      staffProfileId: staff[0].id,
      conversationId: conversations[0].id,
      source: BookingSource.chat,
      status: BookingStatus.confirmed,
      service: "New patient consultation",
      notes: "Booked from AI chat lead flow.",
      preferredStaffName: staff[0].displayName,
      startAt: bookingOneStart,
      endAt: addMinutes(bookingOneStart, 30),
      timezone: DEFAULT_TIMEZONE,
      metadataJson: { seeded: true },
    },
    {
      id: seedId("booking", "2"),
      organizationId: organization.id,
      contactId: contacts[1].id,
      staffProfileId: staff[1].id,
      conversationId: conversations[1].id,
      source: BookingSource.phone,
      status: BookingStatus.confirmed,
      service: "Pricing callback",
      notes: "Follow-up pricing review from inbound phone call.",
      preferredStaffName: staff[1].displayName,
      startAt: bookingTwoStart,
      endAt: addMinutes(bookingTwoStart, 30),
      timezone: DEFAULT_TIMEZONE,
      metadataJson: { seeded: true },
    },
    {
      id: seedId("booking", "3"),
      organizationId: organization.id,
      contactId: contacts[3].id,
      staffProfileId: staff[0].id,
      conversationId: conversations[3].id,
      source: BookingSource.admin,
      status: BookingStatus.completed,
      service: "Reschedule confirmation",
      notes: "Completed yesterday after phone callback.",
      preferredStaffName: staff[0].displayName,
      startAt: bookingThreeStart,
      endAt: addMinutes(bookingThreeStart, 30),
      timezone: DEFAULT_TIMEZONE,
      metadataJson: { seeded: true },
    },
    {
      id: seedId("booking", "4"),
      organizationId: organization.id,
      contactId: contacts[4].id,
      staffProfileId: staff[1].id,
      conversationId: conversations[4].id,
      source: BookingSource.manual,
      status: BookingStatus.canceled,
      service: "Discovery call",
      notes: "Customer asked to push this back to next week.",
      preferredStaffName: staff[1].displayName,
      startAt: bookingFourStart,
      endAt: addMinutes(bookingFourStart, 30),
      timezone: DEFAULT_TIMEZONE,
      metadataJson: { seeded: true },
    },
  ];

  const linkItems = [
    {
      id: seedId("link", "website"),
      profileId: linkProfileId,
      platform: LinkPlatform.website,
      label: "Main website",
      url: `https://${organization.slug}.example`,
      sortOrder: 0,
      visible: true,
    },
    {
      id: seedId("link", "book"),
      profileId: linkProfileId,
      platform: LinkPlatform.custom,
      label: "Book an appointment",
      url: `https://localhost:3000/${organization.slug}/landing`,
      sortOrder: 1,
      visible: true,
    },
    {
      id: seedId("link", "linkedin"),
      profileId: linkProfileId,
      platform: LinkPlatform.linkedin,
      label: "LinkedIn",
      url: "https://www.linkedin.com/company/deskcaptain-demo",
      sortOrder: 2,
      visible: true,
    },
    {
      id: seedId("link", "instagram"),
      profileId: linkProfileId,
      platform: LinkPlatform.instagram,
      label: "Instagram",
      url: "https://www.instagram.com/deskcaptain.demo",
      sortOrder: 3,
      visible: true,
    },
    {
      id: seedId("link", "whatsapp"),
      profileId: linkProfileId,
      platform: LinkPlatform.whatsapp,
      label: "WhatsApp us",
      url: "https://wa.me/447700900199",
      sortOrder: 4,
      visible: true,
    },
  ];

  const notifications = [
    {
      id: seedId("notification", "1"),
      organizationId: organization.id,
      type: NotificationEventType.lead_captured,
      title: "Qualified web lead captured",
      body: "Sarah Mitchell requested a new patient consultation.",
      status: NotificationStatus.unread,
      metadataJson: { seeded: true, leadId: leads[0].id },
      createdAt: hoursAgo(2),
    },
    {
      id: seedId("notification", "2"),
      organizationId: organization.id,
      type: NotificationEventType.booking_confirmed,
      title: "Booking confirmed",
      body: "A pricing callback was booked for James Carter.",
      status: NotificationStatus.read,
      metadataJson: { seeded: true, bookingId: bookings[1].id },
      createdAt: hoursAgo(4.5),
    },
    {
      id: seedId("notification", "3"),
      organizationId: organization.id,
      type: NotificationEventType.transcript_ready,
      title: "Phone transcript ready",
      body: "Pricing call transcript is ready to review.",
      status: NotificationStatus.unread,
      metadataJson: { seeded: true, conversationId: conversations[1].id },
      createdAt: hoursAgo(4.3),
    },
    {
      id: seedId("notification", "4"),
      organizationId: organization.id,
      type: NotificationEventType.lead_captured,
      title: "Urgent callback request",
      body: "A same-day callback request came in by phone.",
      status: NotificationStatus.unread,
      metadataJson: { seeded: true, leadId: leads[5].id },
      createdAt: hoursAgo(1),
    },
    {
      id: seedId("notification", "5"),
      organizationId: organization.id,
      type: NotificationEventType.booking_canceled,
      title: "Booking canceled",
      body: "The discovery call for Hannah Doyle was canceled.",
      status: NotificationStatus.read,
      metadataJson: { seeded: true, bookingId: bookings[3].id },
      createdAt: hoursAgo(6.5),
    },
    {
      id: seedId("notification", "6"),
      organizationId: organization.id,
      type: NotificationEventType.billing_changed,
      title: "Demo billing event",
      body: "Billing notification seeded for UI coverage.",
      status: NotificationStatus.archived,
      metadataJson: { seeded: true },
      createdAt: hoursAgo(30),
    },
  ];

  const auditLogs = [
    {
      id: seedId("audit", "1"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.settings_updated,
      targetType: "receptionist_config",
      targetId: organization.id,
      description: "Seeded receptionist configuration for demo flows.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(36),
    },
    {
      id: seedId("audit", "2"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.organization_updated,
      targetType: "organization",
      targetId: organization.id,
      description: "Seeded demo organization surfaces and defaults.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(35),
    },
    {
      id: seedId("audit", "3"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.link_created,
      targetType: "link_profile",
      targetId: linkProfileId,
      description: "Seeded public links for the business profile.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(34),
    },
    {
      id: seedId("audit", "4"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.customization_updated,
      targetType: "page_customization",
      targetId: organization.id,
      description: "Seeded landing and links customization defaults.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(33),
    },
    {
      id: seedId("audit", "5"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.booking_created,
      targetType: "booking",
      targetId: bookings[0].id,
      description: "Seeded AI-booked consultation from web chat.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(2),
    },
    {
      id: seedId("audit", "6"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.lead_status_changed,
      targetType: "lead",
      targetId: leads[1].id,
      description: "Seeded contacted status for a qualified phone lead.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(5),
    },
    {
      id: seedId("audit", "7"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.notification_marked,
      targetType: "notification",
      targetId: notifications[1].id,
      description: "Seeded read-state notification for realistic dashboard coverage.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(4),
    },
    {
      id: seedId("audit", "8"),
      organizationId: organization.id,
      actorUserId: null,
      action: AuditActionType.booking_updated,
      targetType: "booking",
      targetId: bookings[3].id,
      description: "Seeded canceled booking state for dashboard filters.",
      metadataJson: { seeded: true },
      createdAt: hoursAgo(6),
    },
  ];

  await prisma.$transaction(async (tx) => {
    await tx.organizationContact.createMany({
      data: contacts.map((contact) => ({
        ...contact,
        organizationId: organization.id,
      })),
    });

    await tx.bookableStaffProfile.createMany({
      data: staff.map((member) => ({
        id: member.id,
        organizationId: organization.id,
        membershipId: null,
        displayName: member.displayName,
        email: member.email,
        timezone: member.timezone,
        bookable: true,
        priority: member.priority,
      })),
    });

    await tx.bookableStaffAvailability.createMany({
      data: availabilities,
    });

    await tx.receptionLead.createMany({
      data: leads,
    });

    await tx.receptionConversation.createMany({
      data: conversations,
    });

    await tx.receptionConversationMessage.createMany({
      data: messages,
    });

    await tx.receptionCallRecording.createMany({
      data: recordings,
    });

    await tx.booking.createMany({
      data: bookings,
    });

    await tx.organizationLinkItem.createMany({
      data: linkItems,
    });

    await tx.notificationEvent.createMany({
      data: notifications,
    });

    await tx.auditLog.createMany({
      data: auditLogs,
    });
  });

  console.log("");
  console.log(`Seeded demo data for ${organization.name} (${organization.slug})`);
  console.log(`Organization ID: ${organization.id}`);
  console.log(`Phone extension: ${phoneExtension}`);
  console.log(`Contacts: ${contacts.length}`);
  console.log(`Leads: ${leads.length}`);
  console.log(`Conversations: ${conversations.length}`);
  console.log(`Bookings: ${bookings.length}`);
  console.log(`Links: ${linkItems.length}`);
  console.log(`Notifications: ${notifications.length}`);
  console.log(`Audit logs: ${auditLogs.length}`);
  console.log("");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  const organizationId =
    parseOrgIdFromArgs() ?? process.env.SEED_ORG_ID ?? DEFAULT_ORG_ID;

  await seedOrganization(organizationId);
}

main()
  .catch((error) => {
    console.error("");
    console.error("Seed failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
