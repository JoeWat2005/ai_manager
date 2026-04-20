"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type ReceptionistConfigInput = {
  phoneExtension: string;
  notificationEmail: string;
  faqScript: string;
  transferPhone: string | null;
  phoneEnabled: boolean;
  chatEnabled: boolean;
  timezone: string;
};

type Props = {
  initialConfig: ReceptionistConfigInput;
};

export function ReceptionistConfigForm({ initialConfig }: Props) {
  const [config, setConfig] = useState<ReceptionistConfigInput>(initialConfig);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveConfig(event: React.FormEvent) {
    event.preventDefault();
    setSavingConfig(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/reception/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        config?: ReceptionistConfigInput;
      };

      if (!response.ok || !payload.ok || !payload.config) {
        throw new Error(payload.error ?? "Failed to save receptionist settings");
      }

      setConfig(payload.config);
      setMessage("Receptionist settings saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unexpected settings save error"
      );
    } finally {
      setSavingConfig(false);
    }
  }

  return (
    <Card id="settings-receptionist">
      <CardHeader>
        <CardTitle>Receptionist configuration</CardTitle>
        <CardDescription>
          Configure extension routing, notifications, and AI receptionist behavior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={saveConfig} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reception-phone-extension">4-digit phone extension</Label>
              <Input
                id="reception-phone-extension"
                value={config.phoneExtension}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    phoneExtension: event.target.value,
                  }))
                }
                pattern="\d{4}"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reception-notification-email">Notification email</Label>
              <Input
                id="reception-notification-email"
                type="email"
                value={config.notificationEmail}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    notificationEmail: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reception-transfer-phone">Transfer phone (optional)</Label>
              <Input
                id="reception-transfer-phone"
                value={config.transferPhone ?? ""}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    transferPhone: event.target.value || null,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reception-timezone">Timezone</Label>
              <Input
                id="reception-timezone"
                value={config.timezone}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    timezone: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reception-faq-script">FAQ / assistant instructions</Label>
            <Textarea
              id="reception-faq-script"
              className="min-h-32"
              value={config.faqScript}
              onChange={(event) =>
                setConfig((previous) => ({
                  ...previous,
                  faqScript: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="reception-phone-enabled">Phone enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Accept AI-assisted phone reception on your shared number extension.
                </p>
              </div>
              <Switch
                id="reception-phone-enabled"
                checked={config.phoneEnabled}
                onCheckedChange={(checked) =>
                  setConfig((previous) => ({
                    ...previous,
                    phoneEnabled: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="reception-chat-enabled">Web chat enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Let visitors book or qualify through the landing page assistant.
                </p>
              </div>
              <Switch
                id="reception-chat-enabled"
                checked={config.chatEnabled}
                onCheckedChange={(checked) =>
                  setConfig((previous) => ({
                    ...previous,
                    chatEnabled: checked,
                  }))
                }
              />
            </div>
          </div>

          <Button type="submit" disabled={savingConfig}>
            {savingConfig ? "Saving..." : "Save receptionist settings"}
          </Button>
        </form>

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
            <span>{error ?? message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
