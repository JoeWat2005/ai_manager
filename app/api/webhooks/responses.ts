export function ok(eventType: string, message: string, details?: unknown) {
  console.log(`[Clerk webhook] 200 ${eventType}: ${message}`, details ?? "");
  return Response.json(
    { ok: true, eventType, message, details: details ?? null },
    { status: 200 }
  );
}

export function badRequest(eventType: string, message: string, details?: unknown) {
  console.error(`[Clerk webhook] 400 ${eventType}: ${message}`, details ?? "");
  return Response.json(
    { ok: false, eventType, error: message, details: details ?? null },
    { status: 400 }
  );
}

export function internalError(eventType: string, message: string, details?: unknown) {
  console.error(`[Clerk webhook] 500 ${eventType}: ${message}`, details ?? "");
  return Response.json(
    { ok: false, eventType, error: message, details: details ?? null },
    { status: 500 }
  );
}