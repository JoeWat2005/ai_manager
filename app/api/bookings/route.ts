import { auth } from "@clerk/nextjs/server";
import { createAuditLog } from "@/lib/dashboard/events";
import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import {
  createAutoAssignedBooking,
  getBookableStaffProfiles,
  getOrCreateBookingSettings,
} from "@/lib/bookings/service";
import { prisma } from "@/lib/prisma";
import { getOrganizationByClerkOrgId, getOrganizationBySlug } from "@/lib/reception/org";
import { startTimer } from "@/lib/perf";

// Define expected request body for creating a booking
type CreateBookingBody = {
  slug?: string; // public organization slug, used for public booking flows
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  service?: string;
  notes?: string;
  preferredStaffId?: string;
  preferredStaffName?: string;
  requestedStartAt?: string; // date string
  source?: "manual" | "chat" | "phone" | "admin";
  timezone?: string;
};

// =====================
// GET: Dashboard bookings overview
// =====================
export async function GET() {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const endTimer = startTimer(`GET /api/bookings [org=${access.organization.id}]`);
  const [bookings, settings, staffProfiles] = await Promise.all([
    prisma.booking.findMany({
      where: {
        // Only bookings for the current organization
        organizationId: access.organization.id,
      },
      include: {
        // Include related contact information
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        // Include related staff profile information
        staffProfile: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        // Show newest upcoming/latest bookings first by start time
        startAt: "desc",
      },
      // Limit result size so this endpoint stays reasonable
      take: 300,
    }),

    // Ensure booking settings exist, then return them
    getOrCreateBookingSettings(access.organization.id),

    // Read staff profiles (no sync on GET — sync only happens on booking creation)
    getBookableStaffProfiles(access.organization.id),
  ]);

  endTimer();

  return Response.json({
    ok: true,
    bookings,
    settings,
    staffProfiles,
  });
}

// =====================
// POST: Create booking
// =====================
export async function POST(req: Request) {
  let body: CreateBookingBody;

  // Safely parse JSON body
  try {
    body = (await req.json()) as CreateBookingBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  // customerName is required
  const customerName = body.customerName?.trim();
  if (!customerName) {
    return Response.json(
      { ok: false, error: "customerName is required" },
      { status: 400 }
    );
  }

  // Get current auth state from Clerk
  const authState = await auth();

  // Figure out which organization this booking belongs to:
  // - if signed in with an org, use Clerk org ID
  // - otherwise, try public booking by slug
  const organization = authState.orgId
    ? await getOrganizationByClerkOrgId(authState.orgId)
    : body.slug?.trim()
      ? await getOrganizationBySlug(body.slug.trim())
      : null;

  // If no organization can be resolved, fail
  if (!organization) {
    return Response.json(
      { ok: false, error: "Organization not found" },
      { status: 404 }
    );
  }

  // Parse optional requested start time
  const requestedStartAt =
    typeof body.requestedStartAt === "string" && body.requestedStartAt.trim().length > 0
      ? new Date(body.requestedStartAt)
      : null;

  // Validate date if provided
  if (requestedStartAt && Number.isNaN(requestedStartAt.getTime())) {
    return Response.json(
      { ok: false, error: "requestedStartAt must be a valid date" },
      { status: 400 }
    );
  }

  try {
    // Create the booking using service-layer logic
    // This likely handles:
    // - finding/creating contact
    // - auto-assigning staff
    // - applying booking rules
    // - storing metadata
    const booking = await createAutoAssignedBooking({
      organizationId: organization.id,

      // userId if signed in, otherwise null for public booking flow
      actorUserId: authState.userId ?? null,

      // default source is "manual" if none provided
      source: body.source ?? "manual",

      customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      service: body.service,
      notes: body.notes,
      preferredStaffId: body.preferredStaffId,
      preferredStaffName: body.preferredStaffName,
      requestedStartAt,
      timezone: body.timezone,

      // Extra metadata stored with the booking
      metadataJson: {
        // true if booking came from unauthenticated/public flow
        publicSource: !authState.userId,

        // helpful for tracing where the booking came from
        slug: organization.slug,
      },
    });

    // Only create an audit log when the action was performed by a signed-in user
    // Public bookings do not have a dashboard user actor
    if (authState.userId) {
      await createAuditLog({
        organizationId: organization.id,
        action: "booking_created",
        actorUserId: authState.userId,
        description: `Manual booking created for ${customerName}`,
        targetType: "booking",
        targetId: booking.id,
      });
    }

    // Return created booking
    return Response.json({
      ok: true,
      booking,
    });
  } catch (error) {
    // If service logic rejects the booking (validation/business rule failure),
    // return a user-friendly error message
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 422 }
    );
  }
}
