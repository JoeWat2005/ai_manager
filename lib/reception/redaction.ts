export function redactPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.replace(/\s+/g, "");
  if (trimmed.length <= 4) return "****";
  return `${"*".repeat(Math.max(trimmed.length - 4, 2))}${trimmed.slice(-4)}`;
}

export function redactEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "");
  if (normalized.length < 7) return null;
  return normalized;
}
