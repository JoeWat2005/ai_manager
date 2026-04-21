"use client";

import { useId, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type AccentOption = {
  label: string;
  value: string;
};

const DEFAULT_ACCENT_OPTIONS: AccentOption[] = [
  { label: "Ocean", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Orchid", value: "#7c3aed" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
  { label: "Teal", value: "#0f766e" },
  { label: "Slate", value: "#475569" },
  { label: "Graphite", value: "#111827" },
];

type Props = {
  label: string;
  description?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

function normalizeColor(value: string) {
  return value.trim().toLowerCase();
}

function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function AccentColorSelector({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: Props) {
  const reactId = useId();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const normalizedValue = normalizeColor(value);

  const isPreset = DEFAULT_ACCENT_OPTIONS.some(
    (o) => normalizeColor(o.value) === normalizedValue
  );

  const options = useMemo(() => {
    const normalizedDefaults = DEFAULT_ACCENT_OPTIONS.map((option) => ({
      ...option,
      normalizedValue: normalizeColor(option.value),
    }));

    if (normalizedDefaults.some((option) => option.normalizedValue === normalizedValue)) {
      return normalizedDefaults;
    }

    return [
      { label: "Current", value, normalizedValue },
      ...normalizedDefaults,
    ];
  }, [normalizedValue, value]);

  const selectedOption =
    options.find((option) => option.normalizedValue === normalizedValue) ?? options[0];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <RadioGroup
        value={selectedOption.value}
        onValueChange={onValueChange}
        className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
        disabled={disabled}
        aria-label={label}
      >
        {options.map((option) => {
          const optionId = `${reactId}-${option.label}-${option.value.replace("#", "")}`;
          const isSelected = option.normalizedValue === normalizedValue;

          return (
            <label
              key={`${option.label}-${option.value}`}
              htmlFor={optionId}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
                disabled
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-primary/40 hover:bg-muted/40",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background"
              )}
            >
              <RadioGroupItem
                id={optionId}
                value={option.value}
                disabled={disabled}
                className="mt-0.5"
              />
              <span
                aria-hidden="true"
                className="size-7 shrink-0 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: option.value }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {option.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {option.value.toUpperCase()}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>

      {/* Custom colour wheel picker */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors",
          !isPreset ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background"
        )}
      >
        <div className="relative shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => colorInputRef.current?.click()}
            className={cn(
              "size-8 rounded-full border-2 shadow-sm transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:scale-110",
              !isPreset ? "border-primary" : "border-border/60"
            )}
            style={{ backgroundColor: value }}
            aria-label="Open colour wheel"
          />
          <input
            ref={colorInputRef}
            type="color"
            value={isValidHex(value) ? value : "#2563eb"}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            className="pointer-events-none absolute inset-0 size-0 opacity-0"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Custom colour</p>
          <p className="truncate text-xs text-muted-foreground font-mono">
            {!isPreset ? `${value.toUpperCase()} — active` : "Click to pick any colour"}
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => colorInputRef.current?.click()}
          className={cn(
            "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            disabled
              ? "cursor-not-allowed border-border bg-background text-muted-foreground opacity-60"
              : "cursor-pointer border-border bg-background text-foreground hover:bg-muted"
          )}
        >
          Pick colour
        </button>
      </div>
    </div>
  );
}
