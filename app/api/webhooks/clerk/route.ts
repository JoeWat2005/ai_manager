import { internalError } from "../responses";
import { verifyClerkWebhook } from "../verify";
import { handleClerkEvent } from "../handlers";

export async function POST(req: Request) {
  console.log("[Clerk webhook] Route hit");

  const verified = await verifyClerkWebhook(req);
  if (!verified.ok) {
    return verified.response;
  }

  const evt = verified.event;

  console.log(`[Clerk webhook] Received event: ${evt.type}`);
  console.log(
    `[Clerk webhook] Payload for ${evt.type}:`,
    JSON.stringify(evt.data, null, 2)
  );

  try {
    return await handleClerkEvent(evt);
  } catch (error) {
    return internalError(evt.type, "Webhook handler failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}