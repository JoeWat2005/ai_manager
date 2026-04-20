"use client";

import { useEffect, useState } from "react";
import {
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  type AccessibilityPreferences,
  normalizeAccessibilityPreferences,
} from "@/lib/accessibility/preferences";

function applyPreferencesToDocument(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  root.dataset.a11yContrast = preferences.highContrast ? "high" : "default";
  root.dataset.a11yMotion = preferences.reduceMotion ? "reduce" : "default";
  root.dataset.a11yText = preferences.largeText ? "large" : "default";
}

export function AccessibilityPreferencesCard() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_ACCESSIBILITY_PREFERENCES;
    }

    let initial = DEFAULT_ACCESSIBILITY_PREFERENCES;
    try {
      const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (raw) {
        initial = normalizeAccessibilityPreferences(JSON.parse(raw));
      }
    } catch (error) {
      console.warn("Failed to load accessibility preferences", error);
    }

    return initial;
  });

  useEffect(() => {
    applyPreferencesToDocument(preferences);

    try {
      window.localStorage.setItem(
        ACCESSIBILITY_STORAGE_KEY,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.warn("Failed to persist accessibility preferences", error);
    }
  }, [preferences]);

  function updatePreference<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  return (
    <section className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-5">
        <div>
          <h2 className="card-title">Accessibility Preferences</h2>
          <p className="text-sm text-base-content/70">
            Controls are stored in this browser and applied across the app.
          </p>
        </div>

        <div className="space-y-3">
          <label className="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 px-3 py-2">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={preferences.highContrast}
              onChange={(event) =>
                updatePreference("highContrast", event.target.checked)
              }
            />
            <span className="label-text">High contrast mode</span>
          </label>

          <label className="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 px-3 py-2">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={preferences.reduceMotion}
              onChange={(event) =>
                updatePreference("reduceMotion", event.target.checked)
              }
            />
            <span className="label-text">Reduce motion</span>
          </label>

          <label className="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 px-3 py-2">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={preferences.largeText}
              onChange={(event) =>
                updatePreference("largeText", event.target.checked)
              }
            />
            <span className="label-text">Larger text</span>
          </label>
        </div>

        <p className="sr-only" aria-live="polite">
          Accessibility preferences updated.
        </p>
      </div>
    </section>
  );
}
