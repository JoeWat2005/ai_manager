// Import helper to read incoming request headers in Next.js
import { headers } from "next/headers";

// Import Svix webhook verifier
// Clerk webhooks are signed using Svix
import { Webhook } from "svix";

// Import reusable response helpers
import { badRequest, internalError } from "./responses";

// Import the expected shape of a verified Clerk event
import { VerifiedClerkEvent } from "./types";

// Verify that an incoming webhook request really came from Clerk
export async function verifyClerkWebhook(req: Request): Promise<
  | { ok: true; event: VerifiedClerkEvent }
  | { ok: false; response: Response }
> {
  // Read the raw request body as plain text
  // Important: webhook signature verification usually requires the exact raw body
  const payload = await req.text();

  // Read request headers
  const headerList = await headers();

  // Extract Svix signature headers
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  // Since we may not know the event type yet, use "unknown" for logging/errors
  const eventTypeForLogging = "unknown";

  // All three Svix headers are required for signature verification
  if (!svixId || !svixTimestamp || !svixSignature) {
    return {
      ok: false,
      response: badRequest(eventTypeForLogging, "Missing svix headers", {
        hasSvixId: !!svixId,
        hasSvixTimestamp: !!svixTimestamp,
        hasSvixSignature: !!svixSignature,
      }),
    };
  }

  // Read Clerk webhook signing secret from environment variables
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  // If the server is misconfigured, return a 500 error
  if (!signingSecret) {
    return {
      ok: false,
      response: internalError(
        eventTypeForLogging,
        "Missing webhook signing secret"
      ),
    };
  }

  try {
    // Create Svix verifier using the signing secret
    const wh = new Webhook(signingSecret);

    // Verify webhook signature using raw payload + Svix headers
    // If valid, this returns the parsed event object
    const event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as VerifiedClerkEvent;

    // Verification succeeded
    return { ok: true, event };
  } catch (error) {
    // Signature verification failed
    return {
      ok: false,
      response: badRequest(eventTypeForLogging, "Invalid signature", {
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}