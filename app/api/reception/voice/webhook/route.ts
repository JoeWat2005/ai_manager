import { handleVapiVoiceWebhook } from "@/lib/reception/voice";

export async function POST(req: Request) {
  const result = await handleVapiVoiceWebhook(req);
  return Response.json(result.body, { status: result.status });
}
