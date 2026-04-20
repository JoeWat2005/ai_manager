"use client";

import { useState } from "react";
import { AccentColorSelector } from "@/components/dashboard/AccentColorSelector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Customization = {
  landingHeroTitle: string;
  landingHeroSubtitle: string;
  landingPrimaryCtaLabel: string;
  landingSecondaryCtaLabel: string;
  landingShowBookingForm: boolean;
  landingShowChatWidget: boolean;
  landingAccentColor: string;
  linksTitle: string;
  linksBio: string | null;
  linksAccentColor: string;
  linksButtonStyle: string;
};

type Props = {
  initialCustomization: Customization;
};

export function CustomizationForm({ initialCustomization }: Props) {
  const [customization, setCustomization] = useState(initialCustomization);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveCustomization(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customization),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        customization?: Customization;
      };

      if (!response.ok || !payload.ok || !payload.customization) {
        throw new Error(payload.error ?? "Unable to save customization");
      }

      setCustomization(payload.customization);
      setMessage("Customization settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Landing page customization</CardTitle>
          <CardDescription>
            Control hero copy, CTAs, surfaces, and the accent palette for your business
            landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={saveCustomization}>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-1.5 xl:col-span-2">
                <Label htmlFor="landing-hero-title">Hero title</Label>
                <Input
                  id="landing-hero-title"
                  value={customization.landingHeroTitle}
                  onChange={(event) =>
                    setCustomization((current) => ({
                      ...current,
                      landingHeroTitle: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5 xl:col-span-2">
                <Label htmlFor="landing-hero-subtitle">Hero subtitle</Label>
                <Textarea
                  id="landing-hero-subtitle"
                  value={customization.landingHeroSubtitle}
                  onChange={(event) =>
                    setCustomization((current) => ({
                      ...current,
                      landingHeroSubtitle: event.target.value,
                    }))
                  }
                  className="min-h-28"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="landing-primary-cta">Primary CTA label</Label>
                <Input
                  id="landing-primary-cta"
                  value={customization.landingPrimaryCtaLabel}
                  onChange={(event) =>
                    setCustomization((current) => ({
                      ...current,
                      landingPrimaryCtaLabel: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="landing-secondary-cta">Secondary CTA label</Label>
                <Input
                  id="landing-secondary-cta"
                  value={customization.landingSecondaryCtaLabel}
                  onChange={(event) =>
                    setCustomization((current) => ({
                      ...current,
                      landingSecondaryCtaLabel: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <AccentColorSelector
              label="Landing accent color"
              description="Choose a curated brand accent instead of typing raw hex values."
              value={customization.landingAccentColor}
              onValueChange={(value) =>
                setCustomization((current) => ({
                  ...current,
                  landingAccentColor: value,
                }))
              }
              disabled={saving}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="landing-booking-toggle">Show manual booking form</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep the structured booking form available on the page.
                  </p>
                </div>
                <Switch
                  id="landing-booking-toggle"
                  checked={customization.landingShowBookingForm}
                  onCheckedChange={(checked) =>
                    setCustomization((current) => ({
                      ...current,
                      landingShowBookingForm: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="landing-chat-toggle">Show AI chat widget</Label>
                  <p className="text-sm text-muted-foreground">
                    Let visitors switch into AI-led booking and qualification.
                  </p>
                </div>
                <Switch
                  id="landing-chat-toggle"
                  checked={customization.landingShowChatWidget}
                  onCheckedChange={(checked) =>
                    setCustomization((current) => ({
                      ...current,
                      landingShowChatWidget: checked,
                    }))
                  }
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Saving..." : "Save landing customization"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links page customization</CardTitle>
          <CardDescription>
            Fine-tune your public links profile copy, styling, and button treatment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={saveCustomization}>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="links-title">Links title</Label>
                <Input
                  id="links-title"
                  value={customization.linksTitle}
                  onChange={(event) =>
                    setCustomization((current) => ({
                      ...current,
                      linksTitle: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="links-button-style">Links button style</Label>
                <Select
                  value={customization.linksButtonStyle}
                  onValueChange={(value) =>
                    setCustomization((current) => ({
                      ...current,
                      linksButtonStyle: value ?? current.linksButtonStyle,
                    }))
                  }
                >
                  <SelectTrigger id="links-button-style" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 xl:col-span-2">
                <Label htmlFor="links-bio">Links bio</Label>
                <Textarea
                  id="links-bio"
                  value={customization.linksBio ?? ""}
                  onChange={(event) =>
                    setCustomization((current) => ({
                      ...current,
                      linksBio: event.target.value,
                    }))
                  }
                  className="min-h-28"
                />
              </div>
            </div>

            <AccentColorSelector
              label="Links accent color"
              description="Applies to the header accent and button treatment on your public links page."
              value={customization.linksAccentColor}
              onValueChange={(value) =>
                setCustomization((current) => ({
                  ...current,
                  linksAccentColor: value,
                }))
              }
              disabled={saving}
            />

            <Button type="submit" variant="outline" disabled={saving} className="self-start">
              {saving ? "Saving..." : "Save links customization"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-primary/20 bg-primary/5 text-primary"
          }`}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {error ?? message}
        </div>
      )}
    </div>
  );
}

