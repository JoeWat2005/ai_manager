// Key used to store accessibility preferences in localStorage
export const ACCESSIBILITY_STORAGE_KEY = "deskcaptain.accessibility.v1";

// Type definition for accessibility settings
export type AccessibilityPreferences = {
  highContrast: boolean;   // Enables high contrast UI
  reduceMotion: boolean;   // Disables animations
  largeText: boolean;      // Increases font size
};

// Default values when no preferences are saved
export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  reduceMotion: false,
  largeText: false,
};

// Helper: only returns true if the value is strictly `true`
function getBoolean(value: unknown): boolean {
  return value === true;
}

// Ensures any input becomes a valid AccessibilityPreferences object
export function normalizeAccessibilityPreferences(
  value: unknown
): AccessibilityPreferences {

  // If value is missing or not an object → return defaults
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
  }

  // Treat input as a generic object
  const candidate = value as Record<string, unknown>;

  // Safely extract known fields (ignore everything else)
  return {
    highContrast: getBoolean(candidate.highContrast),
    reduceMotion: getBoolean(candidate.reduceMotion),
    largeText: getBoolean(candidate.largeText),
  };
}

// Returns a string of JavaScript that runs immediately in the browser
export function getAccessibilityBootScript(): string {

  // Safely serialize values so they can be embedded in the script string
  const storageKey = JSON.stringify(ACCESSIBILITY_STORAGE_KEY);
  const defaults = JSON.stringify(DEFAULT_ACCESSIBILITY_PREFERENCES);

  return `
(() => {
  try {
    // Injected values (from the server into the script)
    const storageKey = ${storageKey};
    const defaults = ${defaults};

    // Start with default preferences
    let stored = defaults;

    // Read saved preferences from localStorage
    const raw = window.localStorage.getItem(storageKey);

    if (raw) {
      const parsed = JSON.parse(raw);

      // Validate parsed value is an object
      if (parsed && typeof parsed === "object") {

        // Normalize values (only accept strict true)
        stored = {
          highContrast: parsed.highContrast === true,
          reduceMotion: parsed.reduceMotion === true,
          largeText: parsed.largeText === true,
        };
      }
    }

    // Apply preferences to the <html> element
    const root = document.documentElement;

    // These become: <html data-a11y-contrast="...">
    root.dataset.a11yContrast = stored.highContrast ? "high" : "default";
    root.dataset.a11yMotion = stored.reduceMotion ? "reduce" : "default";
    root.dataset.a11yText = stored.largeText ? "large" : "default";

  } catch (error) {
    // If anything fails, do nothing (never break page load)
  }
})();
`.trim();
}