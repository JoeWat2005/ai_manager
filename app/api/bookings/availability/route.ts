// Import function to find an organization using its public slug (e.g. "my-salon")
import { getOrganizationBySlug } from "@/lib/reception/org";

// Import service that calculates available booking slots
import { listAvailableSlots } from "@/lib/bookings/service";

// Define expected request body shape
type AvailabilityBody = {
  slug?: string;              // public identifier for the organization (required)
  preferredStaffId?: string;  // optional: filter by specific staff member
  startFrom?: string;         // optional: date string to start searching from
  limit?: number;             // optional: how many slots to return
};

// Handle POST request (client asks: "what slots are available?")
export async function POST(req: Request) {
  let body: AvailabilityBody;

  // Safely parse JSON body
  try {
    body = (await req.json()) as AvailabilityBody;
  } catch {
    // If JSON is invalid → return 400 error
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Extract and clean the slug
  const slug = body.slug?.trim();

  // Slug is required (this identifies which organization we’re booking with)
  if (!slug) {
    return Response.json(
      { ok: false, error: "slug is required" },
      { status: 400 }
    );
  }

  // Look up the organization in the database
  const organization = await getOrganizationBySlug(slug);

  // If no organization exists → 404
  if (!organization) {
    return Response.json(
      { ok: false, error: "Organization not found" },
      { status: 404 }
    );
  }

  // Determine the starting date for availability search
  const startFrom =
    // If a valid non-empty string was provided → use it
    typeof body.startFrom === "string" && body.startFrom.trim().length > 0
      ? new Date(body.startFrom)
      // Otherwise → default to current date/time
      : new Date();

  // Validate the date (invalid dates become "NaN")
  if (Number.isNaN(startFrom.getTime())) {
    return Response.json(
      { ok: false, error: "startFrom must be a valid date" },
      { status: 400 }
    );
  }

  // Validate and clamp limit:
  // - default = 5
  // - minimum = 1
  // - maximum = 20
  const limit = Number.isFinite(body.limit)
    ? Math.min(Math.max(body.limit ?? 5, 1), 20)
    : 5;

  // Call the booking service to calculate available time slots
  const slots = await listAvailableSlots({
    organizationId: organization.id,     // required: which org
    preferredStaffId: body.preferredStaffId, // optional filter
    startFrom,                           // when to start searching
    limit,                               // how many results
  });

  // Return the available slots
  return Response.json({
    ok: true,
    slots,
  });
}