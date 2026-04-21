// Import helper that verifies the user is authenticated for an organization
// and also gives back organization + receptionist config info
import { requireAuthedOrganization } from "@/lib/reception/auth";

// Import helper that cleans/normalizes business hours data
import { normalizeBusinessHours } from "@/lib/reception/business-hours";

// Import Prisma database client
import { prisma } from "@/lib/prisma";

// Define the expected shape of the config update request body
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

// Validate a phone extension: must be exactly 4 digits
function validatePhoneExtension(value: string): boolean {
  return /^\d{4}$/.test(value);
}

// Validate an email using a simple regex
function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// GET = fetch current receptionist config
export async function GET() {
  // Check auth + organization access
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  // Return org info + current config
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

// POST = update receptionist config
export async function POST(req: Request) {
  // Check auth + organization access
  const access = await requireAuthedOrganization();
  if (!access.ok) return access.response;

  // Parse JSON body safely
  let body: ConfigUpdateBody;
  try {
    body = (await req.json()) as ConfigUpdateBody;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // We'll build an updates object only with fields that were actually provided
  const updates: Record<string, unknown> = {};

  // Validate and store phone extension
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

  // Validate and store notification email
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

  // Update FAQ script if provided
  if (typeof body.faqScript === "string") {
    updates.faqScript = body.faqScript.trim();
  }

  // transferPhone can either be:
  // - null (clear it)
  // - a string (set it)
  if (body.transferPhone === null || typeof body.transferPhone === "string") {
    updates.transferPhone = body.transferPhone?.trim() || null;
  }

  // Update booleans only if explicitly provided
  if (typeof body.phoneEnabled === "boolean") {
    updates.phoneEnabled = body.phoneEnabled;
  }

  if (typeof body.chatEnabled === "boolean") {
    updates.chatEnabled = body.chatEnabled;
  }

  // Update timezone if it's a non-empty string
  if (typeof body.timezone === "string" && body.timezone.trim().length > 0) {
    updates.timezone = body.timezone.trim();
  }

  // If businessHoursJson was included, normalize it before saving
  if (body.businessHoursJson !== undefined) {
    updates.businessHoursJson = normalizeBusinessHours(body.businessHoursJson);
  }

  try {
    // Save all provided updates to the receptionist config
    const config = await prisma.receptionistConfig.update({
      where: { organizationId: access.organization.id },
      data: updates,
    });

    // Return updated config
    return Response.json({ ok: true, config });
  } catch (error) {
    // Return generic server error message
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
