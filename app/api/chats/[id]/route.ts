import { requireDashboardApiOrg } from "@/lib/dashboard/access";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireDashboardApiOrg();
  if (!access.ok) {
    return access.response;
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ ok: false, error: "Conversation id is required" }, { status: 400 });
  }

  const conversation = await prisma.receptionConversation.findFirst({
    where: {
      id,
      organizationId: access.organization.id,
    },
    include: {
      lead: {
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
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      callRecording: true,
    },
  });

  if (!conversation) {
    return Response.json({ ok: false, error: "Conversation not found" }, { status: 404 });
  }

  return Response.json({ ok: true, conversation });
}
