import { createHash } from "node:crypto"; // used to generate deterministic IDs
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/reception/redaction";

// Input shape when creating/updating a contact
type ContactInput = {
  organizationId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

// --- HELPERS ---

// Returns trimmed string or null if empty
function nonEmpty(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Normalize email (trim + lowercase)
function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = nonEmpty(email);
  return trimmed ? trimmed.toLowerCase() : null;
}

// Build a stable/deterministic contact ID
function buildOrganizationContactId(input: {
  organizationId: string;
  normalizedPhone: string | null;
  email: string | null;
  name: string | null;
}) {

  // Priority: phone → email → name
  const key =
    input.normalizedPhone != null
      ? ["phone", input.normalizedPhone]
      : input.email != null
        ? ["email", input.email]
        : input.name != null
          ? ["name", input.name.toLowerCase()]
          : null;

  // If no identifying info → cannot create ID
  if (!key) {
    return null;
  }

  // Create hash: ensures same input → same ID
  return createHash("md5")
    .update(`${input.organizationId}|${key[0]}|${key[1]}`)
    .digest("hex");
}

// Normalize raw input into consistent contact format
export function normalizeOrganizationContact(input: ContactInput) {

  const name = nonEmpty(input.name);
  const email = normalizeEmail(input.email);
  const phone = nonEmpty(input.phone);

  // Normalize phone (e.g. remove formatting, country codes, etc.)
  const normalizedPhone = normalizePhone(phone);

  // Generate stable ID
  const id = buildOrganizationContactId({
    organizationId: input.organizationId,
    normalizedPhone,
    email,
    name,
  });

  return {
    id,
    organizationId: input.organizationId,
    name,
    email,
    phone,
    normalizedPhone,
  };
}

// Create or update a contact in the database
export async function upsertOrganizationContact(input: ContactInput) {

  const normalized = normalizeOrganizationContact(input);

  // If no ID could be generated → invalid contact
  if (!normalized.id) {
    return null;
  }

  const { id, ...data } = normalized;

  return prisma.organizationContact.upsert({
    where: {
      id, // deterministic ID
    },

    // Create new contact if it doesn't exist
    create: {
      id,
      ...data,
    },

    // Update existing contact (only overwrite provided fields)
    update: {
      ...(normalized.name ? { name: normalized.name } : {}),
      ...(normalized.email ? { email: normalized.email } : {}),
      ...(normalized.phone ? { phone: normalized.phone } : {}),
      ...(normalized.normalizedPhone
        ? { normalizedPhone: normalized.normalizedPhone }
        : {}),
    },
  });
}
