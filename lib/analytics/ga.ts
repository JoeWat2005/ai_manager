"use client"; // This file must run in the browser (client-side only)

// Extend the global Window type so TypeScript knows about gtag/dataLayer
declare global {
  interface Window {
    dataLayer?: unknown[]; // Google Analytics internal array
    gtag?: (...args: unknown[]) => void; // Google Analytics function
  }
}

// Helper function to track a Google Analytics event
export function trackGaEvent(
  eventName: string,
  params: Record<string, unknown> = {}
) {
  // If somehow running on the server, do nothing
  if (typeof window === "undefined") {
    return;
  }

  // If Google Analytics hasn't loaded yet, do nothing
  if (typeof window.gtag !== "function") {
    return;
  }

  // Send event to Google Analytics
  window.gtag("event", eventName, params);
}