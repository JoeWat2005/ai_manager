import { ok } from "../responses";
import { ClerkPaymentAttemptEventData } from "../types";

export async function handlePaymentAttempt(
  eventType: string,
  paymentAttempt: ClerkPaymentAttemptEventData
): Promise<Response> {
  return ok(eventType, "Payment attempt received", {
    paymentAttemptId: paymentAttempt.id,
    status: paymentAttempt.status ?? null,
    amount: paymentAttempt.amount ?? null,
    currency: paymentAttempt.currency ?? null,
  });
}