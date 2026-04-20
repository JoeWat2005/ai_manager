"use client";

import { useState } from "react";
import { trackGaEvent } from "@/lib/analytics/ga";
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
import { Textarea } from "@/components/ui/textarea";

type Props = {
  slug: string;
  ctaLabel: string;
};

type Confirmation = {
  id: string;
  startAt: string;
  endAt: string;
  staffProfile?: {
    displayName: string;
  } | null;
};

export function PublicBookingForm({ slug, ctaLabel }: Props) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    service: "",
    requestedStartAt: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.customerName.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setConfirmation(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customerName: form.customerName,
          customerEmail: form.customerEmail || undefined,
          customerPhone: form.customerPhone || undefined,
          service: form.service || undefined,
          requestedStartAt: form.requestedStartAt
            ? new Date(form.requestedStartAt).toISOString()
            : undefined,
          notes: form.notes || undefined,
          source: "manual",
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        booking?: Confirmation;
      };

      if (!response.ok || !payload.ok || !payload.booking) {
        throw new Error(payload.error ?? "Unable to confirm booking");
      }

      trackGaEvent("booking_submitted", { channel: "web-form" });
      trackGaEvent("booking_confirmed", { channel: "web-form" });

      setConfirmation(payload.booking);
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        service: "",
        requestedStartAt: "",
        notes: "",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Booking failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Book with our team</CardTitle>
        <CardDescription>
          Submit your preferred time and we will instantly confirm the best available slot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="public-customerName">Name</Label>
              <Input
                id="public-customerName"
                required
                value={form.customerName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerName: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="public-customerEmail">Email</Label>
              <Input
                id="public-customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerEmail: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="public-customerPhone">Phone</Label>
              <Input
                id="public-customerPhone"
                value={form.customerPhone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerPhone: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="public-service">Service</Label>
              <Input
                id="public-service"
                value={form.service}
                onChange={(event) =>
                  setForm((current) => ({ ...current, service: event.target.value }))
                }
                placeholder="Consultation"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="public-requestedStartAt">Preferred date & time</Label>
              <Input
                id="public-requestedStartAt"
                type="datetime-local"
                value={form.requestedStartAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requestedStartAt: event.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="public-notes">Notes</Label>
              <Textarea
                id="public-notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="self-start">
            {saving ? "Confirming..." : ctaLabel}
          </Button>
        </form>

        {confirmation && (
          <p className="mt-4 text-sm font-medium text-primary" role="status">
            Booking confirmed for {new Date(confirmation.startAt).toLocaleString()} with{" "}
            {confirmation.staffProfile?.displayName ?? "our team"}.
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
