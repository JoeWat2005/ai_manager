// Import standard success response helper
import { ok } from "../clerk/responses";

// Import the expected shape of payment attempt event data
import { ClerkPaymentAttemptEventData } from "../clerk/types";

// Handle payment attempt webhook events
export async function handlePaymentAttempt(
  eventType: string,
  paymentAttempt: ClerkPaymentAttemptEventData
): Promise<Response> {

  // Return a success response with basic payment info
  return ok(eventType, "Payment attempt received", {
    paymentAttemptId: paymentAttempt.id,

    // Use ?? null to normalize undefined → null
    status: paymentAttempt.status ?? null,
    amount: paymentAttempt.amount ?? null,
    currency: paymentAttempt.currency ?? null,
  });
}