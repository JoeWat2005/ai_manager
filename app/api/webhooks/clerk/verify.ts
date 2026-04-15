import { headers } from "next/headers";
import { Webhook } from "svix";
import { badRequest, internalError } from "./responses";
import { VerifiedClerkEvent } from "./types";

export async function verifyClerkWebhook(req: Request): Promise<
  | { ok: true; event: VerifiedClerkEvent }
  | { ok: false; response: Response }
> {
  const payload = await req.text();
  const headerList = await headers();

  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  const eventTypeForLogging = "unknown";

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

  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
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
    const wh = new Webhook(signingSecret);
    const event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as VerifiedClerkEvent;

    return { ok: true, event };
  } catch (error) {
    return {
      ok: false,
      response: badRequest(eventTypeForLogging, "Invalid signature", {
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}