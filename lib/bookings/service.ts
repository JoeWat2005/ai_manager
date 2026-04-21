import { prisma } from "@/lib/prisma";
import { DEFAULT_BUSINESS_HOURS, getDefaultTimezone } from "@/lib/reception/defaults";
import { normalizeBusinessHours } from "@/lib/reception/business-hours";
import { createAuditLog, createNotificationEvent } from "@/lib/dashboard/events";
import { upsertOrganizationContact } from "@/lib/contacts/service";

// --- TYPES ---

// Days of the week used for scheduling
type WeekdayName =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

// Represents a staff member who can be booked
type StaffProfile = {
  id: string;
  displayName: string;
  email: string | null;
  timezone: string;
  bookable: boolean;
  priority: number;

  // Weekly availability windows
  availabilities: Array<{
    weekday: number;        // 0 = Sunday ... 6 = Saturday
    startMinutes: number;   // minutes since midnight
    endMinutes: number;
    isEnabled: boolean;
  }>;
};

// Represents an existing booking used for conflict checking
type BookingConflict = {
  staffProfileId: string | null;
  startAt: Date;
  endAt: Date;
};

// Input for finding available slots
type FindSlotsInput = {
  organizationId: string;
  preferredStaffId?: string | null;
  startFrom?: Date;
  timezone?: string;
  limit: number;
};

// A valid available time slot result
export type AvailableSlot = {
  startAt: Date;
  endAt: Date;
  staffProfileId: string;
  staffDisplayName: string;
};

// Input for creating a booking
export type CreateBookingInput = {
  organizationId: string;
  actorUserId?: string | null;
  source: "manual" | "chat" | "phone" | "admin";
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  service?: string | null;
  notes?: string | null;
  preferredStaffId?: string | null;
  preferredStaffName?: string | null;
  requestedStartAt?: Date | null;
  timezone?: string | null;
  metadataJson?: unknown;
};

// --- WEEKDAY HELPERS ---

// Maps short weekday labels to full names
const WEEKDAY_LABEL_TO_NAME: Record<string, WeekdayName> = {
  Sun: "sunday",
  Mon: "monday",
  Tue: "tuesday",
  Wed: "wednesday",
  Thu: "thursday",
  Fri: "friday",
  Sat: "saturday",
};

// Maps weekday names to numeric index
const WEEKDAY_NAME_TO_INDEX: Record<WeekdayName, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Convert "HH:MM" → minutes since midnight
function parseTimeToMinutes(value: string): number {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  // Validate input
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return 0;
  }

  return hour * 60 + minute;
}

// Round a date up to the nearest interval (e.g. 30 min)
function roundUpToInterval(date: Date, minutes: number): Date {
  const ms = minutes * 60_000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

// Get weekday + minutes in a specific timezone
function getLocalWeekdayAndMinutes(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const weekdayLabel = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const weekdayName = WEEKDAY_LABEL_TO_NAME[weekdayLabel] ?? "sunday";

  return {
    weekdayName,
    weekdayIndex: WEEKDAY_NAME_TO_INDEX[weekdayName],
    minutes: hour * 60 + minute,
  };
}

// --- VALIDATION HELPERS ---

// Check if slot is inside organization opening hours
function isSlotInsideOrganizationHours(
  startAt: Date,
  slotLengthMinutes: number,
  timezone: string,
  openingHours: ReturnType<typeof normalizeBusinessHours>
): boolean {
  const start = getLocalWeekdayAndMinutes(startAt, timezone);
  const dayConfig = openingHours[start.weekdayName];

  if (!dayConfig?.enabled) return false;

  const dayStart = parseTimeToMinutes(dayConfig.start);
  const dayEnd = parseTimeToMinutes(dayConfig.end);
  const slotEndMinutes = start.minutes + slotLengthMinutes;

  return start.minutes >= dayStart && slotEndMinutes <= dayEnd;
}

// Check if slot fits staff availability
function isSlotInsideStaffAvailability(
  staff: StaffProfile,
  startAt: Date,
  slotLengthMinutes: number,
  timezone: string
): boolean {
  const local = getLocalWeekdayAndMinutes(startAt, timezone);
  const slotEndMinutes = local.minutes + slotLengthMinutes;

  const windows = staff.availabilities.filter(
    (a) => a.isEnabled && a.weekday === local.weekdayIndex
  );

  if (windows.length === 0) return false;

  return windows.some(
    (w) => local.minutes >= w.startMinutes && slotEndMinutes <= w.endMinutes
  );
}

// Check if slot overlaps an existing booking
function hasConflict(
  conflicts: BookingConflict[],
  staffProfileId: string,
  startAt: Date,
  endAt: Date
): boolean {
  return conflicts.some((b) => {
    if (b.staffProfileId !== staffProfileId) return false;
    return startAt < b.endAt && endAt > b.startAt;
  });
}

// Create a readable name from email
function buildDisplayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "staff";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Create default availability for new staff
async function createDefaultAvailabilities(staffProfileId: string) {
  const base = normalizeBusinessHours(DEFAULT_BUSINESS_HOURS);

  const rows = Object.entries(base).map(([weekdayName, schedule]) => ({
    staffProfileId,
    weekday: WEEKDAY_NAME_TO_INDEX[weekdayName as WeekdayName],
    startMinutes: parseTimeToMinutes(schedule.start),
    endMinutes: parseTimeToMinutes(schedule.end),
    isEnabled: schedule.enabled,
  }));

  await prisma.bookableStaffAvailability.createMany({ data: rows });
}

// Ensure booking settings exist
export async function getOrCreateBookingSettings(organizationId: string) {
  const existing = await prisma.bookingSettings.findUnique({
    where: { organizationId },
  });

  if (existing) return existing;

  return prisma.bookingSettings.create({
    data: {
      organizationId,
      timezone: getDefaultTimezone(),
      slotLengthMinutes: 30,
      openingHoursJson: DEFAULT_BUSINESS_HOURS,
      instantConfirm: true,
      autoAssign: true,
    },
  });
}

// Sync staff profiles with organization members
export async function syncBookableStaffProfiles(organizationId: string) {
  const [memberships, existingProfiles] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { organizationId },
      select: { id: true, user: { select: { email: true } } },
    }),
    prisma.bookableStaffProfile.findMany({
      where: { organizationId },
      select: { id: true, membershipId: true },
    }),
  ]);

  const existingMembershipIds = new Set(
    existingProfiles.map((p) => p.membershipId).filter(Boolean)
  );

  // Create missing staff profiles
  for (const membership of memberships) {
    if (existingMembershipIds.has(membership.id)) continue;

    const profile = await prisma.bookableStaffProfile.create({
      data: {
        organizationId,
        membershipId: membership.id,
        displayName: buildDisplayNameFromEmail(membership.user.email),
        email: membership.user.email,
        timezone: getDefaultTimezone(),
        bookable: true,
      },
      select: { id: true },
    });

    await createDefaultAvailabilities(profile.id);
  }

  return prisma.bookableStaffProfile.findMany({
    where: { organizationId },
    include: { availabilities: true },
    orderBy: [{ priority: "asc" }, { displayName: "asc" }],
  });
}

// Fetch existing bookings to detect conflicts
async function getBookingConflicts(
  organizationId: string,
  windowStart: Date,
  windowEnd: Date
): Promise<BookingConflict[]> {
  return prisma.booking.findMany({
    where: {
      organizationId,
      status: { in: ["confirmed", "completed"] },
      startAt: { lt: windowEnd },
      endAt: { gt: windowStart },
    },
    select: {
      staffProfileId: true,
      startAt: true,
      endAt: true,
    },
  });
}

// --- SLOT FINDING ENGINE (CORE LOGIC) ---

async function findAvailableSlotsInternal(
  input: FindSlotsInput
): Promise<AvailableSlot[]> {
  const settings = await getOrCreateBookingSettings(input.organizationId);
  const timezone = input.timezone ?? settings.timezone;
  const slotLengthMinutes = Math.max(settings.slotLengthMinutes, 15);
  const openingHours = normalizeBusinessHours(settings.openingHoursJson);

  const staffProfiles = await syncBookableStaffProfiles(input.organizationId);
  const bookableStaff = staffProfiles.filter((s) => s.bookable);

  if (bookableStaff.length === 0) return [];

  // Prioritize preferred staff
  const preferredStaff =
    input.preferredStaffId != null
      ? bookableStaff.find((s) => s.id === input.preferredStaffId) ?? null
      : null;

  const orderedStaff = preferredStaff
    ? [preferredStaff, ...bookableStaff.filter((s) => s.id !== preferredStaff.id)]
    : bookableStaff;

  // Define search window (next 14 days)
  const searchStart = roundUpToInterval(
    input.startFrom && input.startFrom.getTime() > Date.now()
      ? input.startFrom
      : new Date(),
    slotLengthMinutes
  );

  const searchEnd = new Date(searchStart.getTime() + 14 * 24 * 60 * 60 * 1000);

  const conflicts = await getBookingConflicts(
    input.organizationId,
    searchStart,
    searchEnd
  );

  const slots: AvailableSlot[] = [];
  const stepMs = slotLengthMinutes * 60_000;

  // Iterate through time slots
  for (
    let cursor = searchStart.getTime();
    cursor <= searchEnd.getTime() && slots.length < input.limit;
    cursor += stepMs
  ) {
    const startAt = new Date(cursor);
    const endAt = new Date(cursor + stepMs);

    if (!isSlotInsideOrganizationHours(startAt, slotLengthMinutes, timezone, openingHours)) {
      continue;
    }

    const availableStaff = orderedStaff.find((staff) => {
      if (!isSlotInsideStaffAvailability(staff, startAt, slotLengthMinutes, timezone)) {
        return false;
      }
      return !hasConflict(conflicts, staff.id, startAt, endAt);
    });

    if (!availableStaff) continue;

    slots.push({
      startAt,
      endAt,
      staffProfileId: availableStaff.id,
      staffDisplayName: availableStaff.displayName,
    });
  }

  return slots;
}

// Public API to list slots
export async function listAvailableSlots(input: FindSlotsInput) {
  return findAvailableSlotsInternal(input);
}

// --- BOOKING CREATION ---

export async function createAutoAssignedBooking(input: CreateBookingInput) {
  const settings = await getOrCreateBookingSettings(input.organizationId);
  const timezone = input.timezone?.trim() || settings.timezone;

  // Find best available slot
  const slots = await findAvailableSlotsInternal({
    organizationId: input.organizationId,
    preferredStaffId: input.preferredStaffId,
    startFrom: input.requestedStartAt ?? new Date(),
    timezone,
    limit: 1,
  });

  const bestSlot = slots[0];
  if (!bestSlot) {
    throw new Error("No available slots in the next 14 days");
  }

  // Ensure contact exists
  const contact = await upsertOrganizationContact({
    organizationId: input.organizationId,
    name: input.customerName,
    email: input.customerEmail,
    phone: input.customerPhone,
  });

  if (!contact) {
    throw new Error("A booking contact name, email, or phone is required");
  }

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      organizationId: input.organizationId,
      contactId: contact.id,
      staffProfileId: bestSlot.staffProfileId,
      source: input.source,
      status: "confirmed",
      service: input.service?.trim() || null,
      notes: input.notes?.trim() || null,
      preferredStaffName: input.preferredStaffName?.trim() || null,
      startAt: bestSlot.startAt,
      endAt: bestSlot.endAt,
      timezone,
      metadataJson:
        input.metadataJson && typeof input.metadataJson === "object"
          ? (input.metadataJson as object)
          : undefined,
    },
    include: {
      contact: { select: { id: true, name: true, email: true, phone: true } },
      staffProfile: { select: { id: true, displayName: true } },
    },
  });

  // Fire side effects
  await Promise.all([
    createNotificationEvent({
      organizationId: input.organizationId,
      type: "booking_confirmed",
      title: "Booking confirmed",
      body: `${contact.name ?? "A customer"} booked ${input.service?.trim() || "a session"}`,
      metadataJson: { bookingId: booking.id, source: input.source },
    }),
    createAuditLog({
      organizationId: input.organizationId,
      action: "booking_created",
      description: `Booking created for ${contact.name ?? "unknown contact"}`,
      actorUserId: input.actorUserId,
      targetType: "booking",
      targetId: booking.id,
      metadataJson: { source: input.source },
    }),
  ]);

  return booking;
}