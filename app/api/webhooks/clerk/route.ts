// Import helper to return a 500 error response in a consistent format
import { internalError } from "./responses";

// Import function that verifies the webhook came from Clerk (security)
import { verifyClerkWebhook } from "./verify";

// Import function that handles different Clerk events (business logic)
import { handleClerkEvent } from "../handlers";

// This handles POST requests from Clerk webhooks
export async function POST(req: Request) {
  // Log that the endpoint was hit (useful for debugging)
  console.log("[Clerk webhook] Route hit");

  // Step 1: Verify webhook authenticity
  const verified = await verifyClerkWebhook(req);

  // If verification fails, return its response immediately (likely 400/401)
  if (!verified.ok) {
    return verified.response;
  }

  // Extract the verified event object
  const evt = verified.event;

  // Log event type (e.g. "user.created", "organization.created")
  console.log(`[Clerk webhook] Received event: ${evt.type}`);

  // Log full payload for debugging (pretty printed)
  console.log(
    `[Clerk webhook] Payload for ${evt.type}:`,
    JSON.stringify(evt.data, null, 2)
  );

  try {
    // Step 2: Pass event to handler function
    // This function decides what to do based on event type
    return await handleClerkEvent(evt);
  } catch (error) {
    // Step 3: Catch unexpected errors and return a 500 response
    return internalError(evt.type, "Webhook handler failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}