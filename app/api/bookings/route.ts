import { auth } from "@clerk/nextjs/server";
import { createAuditLog } from "@/lib/dashboard/events";
import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import {
  createAutoAssignedBooking,
  getOrCreateBookingSettings,
  syncBookableStaffProfiles,
} from "@/lib/bookings/service";
import { prisma } from "@/lib/prisma";
import { getOrganizationByClerkOrgId, getOrganizationBySlug } from "@/lib/reception/org";

type CreateBookingBody = {
  slug?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  service?: string;
  notes?: string;
  preferredStaffId?: string;
  preferredStaffName?: string;
  requestedStartAt?: string;
  source?: "manual" | "chat" | "phone" | "admin";
  timezone?: string;
};

export async function GET() {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const [bookings, settings, staffProfiles] = await Promise.all([
    prisma.booking.findMany({
      where: {
        organizationId: access.organization.id,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        staffProfile: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startAt: "desc",
      },
      take: 300,
    }),
    getOrCreateBookingSettings(access.organization.id),
    syncBookableStaffProfiles(access.organization.id),
  ]);

  return Response.json({
    ok: true,
    bookings,
    settings,
    staffProfiles,
  });
}

export async function POST(req: Request) {
  let body: CreateBookingBody;

  try {
    body = (await req.json()) as CreateBookingBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const customerName = body.customerName?.trim();
  if (!customerName) {
    return Response.json(
      { ok: false, error: "customerName is required" },
      { status: 400 }
    );
  }

  const authState = await auth();
  const organization = authState.orgId
    ? await getOrganizationByClerkOrgId(authState.orgId)
    : body.slug?.trim()
      ? await getOrganizationBySlug(body.slug.trim())
      : null;

  if (!organization) {
    return Response.json(
      { ok: false, error: "Organization not found" },
      { status: 404 }
    );
  }

  const requestedStartAt =
    typeof body.requestedStartAt === "string" && body.requestedStartAt.trim().length > 0
      ? new Date(body.requestedStartAt)
      : null;

  if (requestedStartAt && Number.isNaN(requestedStartAt.getTime())) {
    return Response.json(
      { ok: false, error: "requestedStartAt must be a valid date" },
      { status: 400 }
    );
  }

  try {
    const booking = await createAutoAssignedBooking({
      organizationId: organization.id,
      actorUserId: authState.userId ?? null,
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
      metadataJson: {
        publicSource: !authState.userId,
        slug: organization.slug,
      },
    });

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

    return Response.json({
      ok: true,
      booking,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 422 }
    );
  }
}
