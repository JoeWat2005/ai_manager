// Import helper that ensures the user is authenticated
// and belongs to an organization in the reception area
import { requireAuthedOrganization } from "@/lib/reception/auth";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define the expected request body shape
type LeadUpdateBody = {
  // Allowed lead statuses
  status?: "new" | "contacted" | "closed";
};

// Handle PATCH request for updating one lead
export async function PATCH(
  req: Request,
  // params comes from a dynamic route like /leads/[id]
  { params }: { params: Promise<{ id: string }> }
) {
  // Check auth + organization access
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  // Extract the lead ID from the URL
  const { id } = await params;

  // Validate that an ID exists
  if (!id) {
    return Response.json(
      { ok: false, error: "Lead id is required" },
      { status: 400 }
    );
  }

  // Safely parse the JSON request body
  let body: LeadUpdateBody;
  try {
    body = (await req.json()) as LeadUpdateBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate that status exists and is one of the allowed values
  if (!body.status || !["new", "contacted", "closed"].includes(body.status)) {
    return Response.json(
      { ok: false, error: "status must be one of: new, contacted, closed" },
      { status: 400 }
    );
  }

  // Find the lead, but only if it belongs to the current organization
  const existing = await prisma.receptionLead.findFirst({
    where: {
      id,
      organizationId: access.organization.id,
    },
    select: {
      id: true, // only fetch ID since that's all we need here
    },
  });

  // If lead doesn't exist or doesn't belong to this org → 404
  if (!existing) {
    return Response.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  // Update the lead status
  const lead = await prisma.receptionLead.update({
    where: { id: existing.id },

    // Include related contact info in the response
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },

    data: {
      status: body.status,
    },
  });

  // Return updated lead
  return Response.json({
    ok: true,
    lead,
  });
}
