"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    if (typeof window === "undefined") return DEFAULT_ACCESSIBILITY_PREFERENCES;
    try {
      const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (raw) return normalizeAccessibilityPreferences(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  });

  useEffect(() => {
    applyPreferencesToDocument(preferences);
    try {
      window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* ignore */
    }
  }, [preferences]);

  function update<K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  const rows: { key: keyof AccessibilityPreferences; label: string; description: string }[] = [
    {
      key: "highContrast",
      label: "High contrast",
      description: "Increases foreground/background contrast ratios across the app.",
    },
    {
      key: "reduceMotion",
      label: "Reduce motion",
      description: "Disables entrance animations, transitions, and auto-scrolling.",
    },
    {
      key: "largeText",
      label: "Larger text",
      description: "Increases base font size from 16 px to 17 px site-wide.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility preferences</CardTitle>
        <CardDescription>
          Stored in this browser and applied immediately across the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
          >
            <div className="flex flex-col gap-0.5">
              <Label htmlFor={`a11y-${key}`} className="cursor-pointer font-medium">
                {label}
              </Label>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
              id={`a11y-${key}`}
              checked={preferences[key] as boolean}
              onCheckedChange={(checked) => update(key, checked as AccessibilityPreferences[typeof key])}
            />
          </div>
        ))}
        <p className="sr-only" aria-live="polite">
          Accessibility preferences updated.
        </p>
      </CardContent>
    </Card>
  );
}
