import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/reception/redaction";

type ContactInput = {
  organizationId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

function nonEmpty(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = nonEmpty(email);
  return trimmed ? trimmed.toLowerCase() : null;
}

function buildOrganizationContactId(input: {
  organizationId: string;
  normalizedPhone: string | null;
  email: string | null;
  name: string | null;
}) {
  const key =
    input.normalizedPhone != null
      ? ["phone", input.normalizedPhone]
      : input.email != null
        ? ["email", input.email]
        : input.name != null
          ? ["name", input.name.toLowerCase()]
          : null;

  if (!key) {
    return null;
  }

  return createHash("md5")
    .update(`${input.organizationId}|${key[0]}|${key[1]}`)
    .digest("hex");
}

export function normalizeOrganizationContact(input: ContactInput) {
  const name = nonEmpty(input.name);
  const email = normalizeEmail(input.email);
  const phone = nonEmpty(input.phone);
  const normalizedPhone = normalizePhone(phone);
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

export async function upsertOrganizationContact(input: ContactInput) {
  const normalized = normalizeOrganizationContact(input);

  if (!normalized.id) {
    return null;
  }

  const { id, ...data } = normalized;

  return prisma.organizationContact.upsert({
    where: {
      id,
    },
    create: {
      id,
      ...data,
    },
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
