import { requireAuthedOrganization } from "@/lib/reception/auth";
import { prisma } from "@/lib/prisma";

type LeadUpdateBody = {
  status?: "new" | "contacted" | "closed";
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  const { id } = await params;
  if (!id) {
    return Response.json({ ok: false, error: "Lead id is required" }, { status: 400 });
  }

  let body: LeadUpdateBody;
  try {
    body = (await req.json()) as LeadUpdateBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status || !["new", "contacted", "closed"].includes(body.status)) {
    return Response.json(
      { ok: false, error: "status must be one of: new, contacted, closed" },
      { status: 400 }
    );
  }

  const existing = await prisma.receptionLead.findFirst({
    where: {
      id,
      organizationId: access.organization.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return Response.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  const lead = await prisma.receptionLead.update({
    where: { id: existing.id },
    data: { status: body.status },
  });

  return Response.json({ ok: true, lead });
}
