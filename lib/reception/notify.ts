import { redactEmail, redactPhone } from "./redaction";

type NotificationPayload = {
  toEmail: string;
  organizationName: string;
  channel: "phone" | "web";
  name: string;
  phone: string;
  intent: string;
  callbackWindow: string | null;
};

export async function sendQualifiedLeadNotification(
  payload: NotificationPayload
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn("[Reception notify] Missing email provider config", {
      hasApiKey: !!apiKey,
      hasFromEmail: !!from,
      toEmail: redactEmail(payload.toEmail),
      phone: redactPhone(payload.phone),
    });
    return { sent: false, reason: "missing_provider_config" };
  }

  const subject = `[Deskcaptain] New qualified ${payload.channel} lead for ${payload.organizationName}`;
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

    if (!response.ok) {
      const responseText = await response.text();
      console.error("[Reception notify] Email send failed", {
        status: response.status,
        responseText,
        toEmail: redactEmail(payload.toEmail),
      });
      return { sent: false, reason: "provider_error" };
    }

    return { sent: true };
  } catch (error) {
    console.error("[Reception notify] Email request crashed", {
      error: error instanceof Error ? error.message : String(error),
      toEmail: redactEmail(payload.toEmail),
    });
    return { sent: false, reason: "request_failed" };
  }
}
