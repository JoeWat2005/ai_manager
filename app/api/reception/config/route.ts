import { requireAuthedOrganization } from "@/lib/reception/auth";
import { normalizeBusinessHours } from "@/lib/reception/business-hours";
import { prisma } from "@/lib/prisma";

type ConfigUpdateBody = {
  phoneExtension?: string;
  notificationEmail?: string;
  faqScript?: string;
  transferPhone?: string | null;
  phoneEnabled?: boolean;
  chatEnabled?: boolean;
  timezone?: string;
  businessHoursJson?: unknown;
};

function validatePhoneExtension(value: string): boolean {
  return /^\d{4}$/.test(value);
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  return Response.json({
    ok: true,
    organization: {
      id: access.organization.id,
      slug: access.organization.slug,
      name: access.organization.name,
    },
    config: access.config,
  });
}

export async function POST(req: Request) {
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  let body: ConfigUpdateBody;
  try {
    body = (await req.json()) as ConfigUpdateBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.phoneExtension === "string") {
    const extension = body.phoneExtension.trim();
    if (!validatePhoneExtension(extension)) {
      return Response.json(
        { ok: false, error: "phoneExtension must be exactly 4 digits" },
        { status: 400 }
      );
    }
    updates.phoneExtension = extension;
  }

  if (typeof body.notificationEmail === "string") {
    const email = body.notificationEmail.trim();
    if (!validateEmail(email)) {
      return Response.json(
        { ok: false, error: "notificationEmail must be a valid email" },
        { status: 400 }
      );
    }
    updates.notificationEmail = email;
  }

  if (typeof body.faqScript === "string") {
    updates.faqScript = body.faqScript.trim();
  }

  if (body.transferPhone === null || typeof body.transferPhone === "string") {
    updates.transferPhone = body.transferPhone?.trim() || null;
  }

  if (typeof body.phoneEnabled === "boolean") {
    updates.phoneEnabled = body.phoneEnabled;
  }
  if (typeof body.chatEnabled === "boolean") {
    updates.chatEnabled = body.chatEnabled;
  }

  if (typeof body.timezone === "string" && body.timezone.trim().length > 0) {
    updates.timezone = body.timezone.trim();
  }

  if (body.businessHoursJson !== undefined) {
    updates.businessHoursJson = normalizeBusinessHours(body.businessHoursJson);
  }

  try {
    const config = await prisma.receptionistConfig.update({
      where: { organizationId: access.organization.id },
      data: updates,
    });

    return Response.json({ ok: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
