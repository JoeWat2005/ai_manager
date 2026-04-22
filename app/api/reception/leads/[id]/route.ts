// Lead status updates only need auth + org + paid plan — no receptionist config required.
import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { createAuditLog } from "@/lib/dashboard/events";
import { prisma } from "@/lib/prisma";

type LeadUpdateBody = {
  status?: "new" | "contacted" | "closed";
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireDashboardApiOrg({ requirePaidPlan: true });
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

  const existing = await prisma.receptionLead.findFirst({
    where: { id, organizationId: access.organization.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return Response.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  const lead = await prisma.receptionLead.update({
    where: { id: existing.id },
    include: {
      contact: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    data: { status: body.status },
  });

  void createAuditLog({
    organizationId: access.organization.id,
    action: "lead_status_changed",
    actorUserId: access.userId,
    description: `Lead status changed from ${existing.status} to ${body.status}`,
    targetType: "lead",
    targetId: existing.id,
    metadataJson: { previousStatus: existing.status, nextStatus: body.status },
  }).catch(console.error);

  return Response.json({ ok: true, lead });
}
