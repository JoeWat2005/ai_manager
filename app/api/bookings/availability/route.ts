import { getOrganizationBySlug } from "@/lib/reception/org";
import { listAvailableSlots } from "@/lib/bookings/service";

type AvailabilityBody = {
  slug?: string;
  preferredStaffId?: string;
  startFrom?: string;
  limit?: number;
};

export async function POST(req: Request) {
  let body: AvailabilityBody;

  try {
    body = (await req.json()) as AvailabilityBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return Response.json({ ok: false, error: "slug is required" }, { status: 400 });
  }

  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    return Response.json({ ok: false, error: "Organization not found" }, { status: 404 });
  }

  const startFrom =
    typeof body.startFrom === "string" && body.startFrom.trim().length > 0
      ? new Date(body.startFrom)
      : new Date();

  if (Number.isNaN(startFrom.getTime())) {
    return Response.json(
      { ok: false, error: "startFrom must be a valid date" },
      { status: 400 }
    );
  }

  const limit = Number.isFinite(body.limit) ? Math.min(Math.max(body.limit ?? 5, 1), 20) : 5;

  const slots = await listAvailableSlots({
    organizationId: organization.id,
    preferredStaffId: body.preferredStaffId,
    startFrom,
    limit,
  });

  return Response.json({
    ok: true,
    slots,
  });
}
