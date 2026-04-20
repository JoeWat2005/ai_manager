export const ACCESSIBILITY_STORAGE_KEY = "deskcaptain.accessibility.v1";

export type AccessibilityPreferences = {
  highContrast: boolean;
  reduceMotion: boolean;
  largeText: boolean;
};

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  highContrast: false,
  reduceMotion: false,
  largeText: false,
};

function getBoolean(value: unknown): boolean {
  return value === true;
}

export function normalizeAccessibilityPreferences(
  value: unknown
): AccessibilityPreferences {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
  }

  const candidate = value as Record<string, unknown>;

  return {
    highContrast: getBoolean(candidate.highContrast),
    reduceMotion: getBoolean(candidate.reduceMotion),
    largeText: getBoolean(candidate.largeText),
  };
}

export function getAccessibilityBootScript(): string {
  const storageKey = JSON.stringify(ACCESSIBILITY_STORAGE_KEY);
  const defaults = JSON.stringify(DEFAULT_ACCESSIBILITY_PREFERENCES);

  return `
(() => {
  try {
    const storageKey = ${storageKey};
    const defaults = ${defaults};
    let stored = defaults;

    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        stored = {
          highContrast: parsed.highContrast === true,
          reduceMotion: parsed.reduceMotion === true,
          largeText: parsed.largeText === true,
        };
      }
    }

    const root = document.documentElement;
    root.dataset.a11yContrast = stored.highContrast ? "high" : "default";
    root.dataset.a11yMotion = stored.reduceMotion ? "reduce" : "default";
    root.dataset.a11yText = stored.largeText ? "large" : "default";
  } catch (error) {
    // Ignore preference boot failures and keep default rendering.
  }
})();
`.trim();
}
