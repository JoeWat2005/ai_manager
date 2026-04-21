import { redactEmail, redactPhone } from "./redaction";

// Data needed to send a qualified lead notification email
type NotificationPayload = {
  toEmail: string;                 // where to send the alert
  organizationName: string;       // business name
  channel: "phone" | "web";       // where the lead came from
  name: string;                   // lead's name
  phone: string;                  // lead's phone number
  intent: string;                 // what the lead wants
  callbackWindow: string | null;  // preferred callback time
};

// Send an email notification when a lead becomes qualified
export async function sendQualifiedLeadNotification(
  payload: NotificationPayload
): Promise<{ sent: boolean; reason?: string }> {
  // Read email provider config from environment
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  // If provider config is missing, log a warning and skip sending
  if (!apiKey || !from) {
    console.warn("[Reception notify] Missing email provider config", {
      hasApiKey: !!apiKey,
      hasFromEmail: !!from,

      // Redact sensitive info before logging
      toEmail: redactEmail(payload.toEmail),
      phone: redactPhone(payload.phone),
    });

    return { sent: false, reason: "missing_provider_config" };
  }

  // Build email subject line
  const subject = `[Deskcaptain] New qualified ${payload.channel} lead for ${payload.organizationName}`;

  // Build email HTML body
  const html = `
    <h2>New qualified lead</h2>
    <p><strong>Organization:</strong> ${payload.organizationName}</p>
    <p><strong>Channel:</strong> ${payload.channel}</p>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Intent:</strong> ${payload.intent}</p>
    <p><strong>Preferred callback window:</strong> ${payload.callbackWindow ?? "Not specified"}</p>
  `;

  try {
    // Send email through Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.toEmail],
        subject,
        html,
      }),
    });

    // If provider returned an error, log it and return failure
    if (!response.ok) {
      const responseText = await response.text();

      console.error("[Reception notify] Email send failed", {
        status: response.status,
        responseText,

        // Redact email before logging
        toEmail: redactEmail(payload.toEmail),
      });

      return { sent: false, reason: "provider_error" };
    }

    // Success
    return { sent: true };
  } catch (error) {
    // Network/request crash
    console.error("[Reception notify] Email request crashed", {
      error: error instanceof Error ? error.message : String(error),
      toEmail: redactEmail(payload.toEmail),
    });

    return { sent: false, reason: "request_failed" };
  }
}
