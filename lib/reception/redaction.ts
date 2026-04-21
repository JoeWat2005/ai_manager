// --- REDACT PHONE NUMBER ---
// Masks a phone number except for the last 4 digits
export function redactPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove spaces (but keep digits)
  const trimmed = phone.replace(/\s+/g, "");

  // If too short, just return ****
  if (trimmed.length <= 4) return "****";

  // Replace all but last 4 digits with *
  return `${"*".repeat(Math.max(trimmed.length - 4, 2))}${trimmed.slice(-4)}`;
}

// --- REDACT EMAIL ---
// Masks email username but keeps domain visible
export function redactEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const [local, domain] = email.split("@");

  // If malformed email → fallback mask
  if (!local || !domain) return "***";

  // Keep first letter, mask the rest
  const visible = local.slice(0, 1);

  return `${visible}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

// --- NORMALIZE PHONE ---
// Converts phone into a clean format for storage
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove everything except digits and "+"
  const normalized = phone.replace(/[^\d+]/g, "");

  // Reject too-short numbers (likely invalid)
  if (normalized.length < 7) return null;

  return normalized;
}