// Helper for successful webhook responses (HTTP 200)
export function ok(eventType: string, message: string, details?: unknown) {
  // Log success to console
  console.log(
    `[Clerk webhook] 200 ${eventType}: ${message}`,
    details ?? ""
  );

  // Return JSON response with success format
  return Response.json(
    {
      ok: true,           // success flag
      eventType,          // what kind of webhook event this was
      message,            // human-readable message
      details: details ?? null, // optional extra data
    },
    { status: 200 }
  );
}

// Helper for client errors (HTTP 400)
export function badRequest(eventType: string, message: string, details?: unknown) {
  // Log error to console
  console.error(
    `[Clerk webhook] 400 ${eventType}: ${message}`,
    details ?? ""
  );

  // Return JSON response with error format
  return Response.json(
    {
      ok: false,          // failure flag
      eventType,
      error: message,     // error message instead of "message"
      details: details ?? null,
    },
    { status: 400 }
  );
}

// Helper for server errors (HTTP 500)
export function internalError(eventType: string, message: string, details?: unknown) {
  // Log error to console
  console.error(
    `[Clerk webhook] 500 ${eventType}: ${message}`,
    details ?? ""
  );

  // Return JSON response with server error format
  return Response.json(
    {
      ok: false,
      eventType,
      error: message,
      details: details ?? null,
    },
    { status: 500 }
  );
}