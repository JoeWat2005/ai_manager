// Import the function that handles the actual voice webhook logic
import { handleVapiVoiceWebhook } from "@/lib/reception/voice";

// Handle POST requests (webhook endpoint)
export async function POST(req: Request) {
  // Pass the entire request to the voice handler
  // This function likely:
  // - parses the webhook payload
  // - processes voice events (call started, ended, transcript, etc.)
  // - returns a structured response
  const result = await handleVapiVoiceWebhook(req);

  // Return the response from the handler
  // result.body → JSON response
  // result.status → HTTP status code
  return Response.json(result.body, { status: result.status });
}