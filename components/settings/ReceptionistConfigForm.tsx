"use client";

import { useState } from "react";

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
    <section
      id="settings-receptionist"
      className="card border border-base-300 bg-base-100 shadow-sm"
    >
      <div className="card-body gap-5">
        <div>
          <h2 className="card-title">Receptionist Configuration</h2>
          <p className="text-sm text-base-content/70">
            Configure extension routing, notifications, and AI receptionist behavior.
          </p>
        </div>

        <form onSubmit={saveConfig} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="form-control">
              <span className="label-text">4-digit phone extension</span>
              <input
                className="input input-bordered"
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
            </label>

            <label className="form-control">
              <span className="label-text">Notification email</span>
              <input
                type="email"
                className="input input-bordered"
                value={config.notificationEmail}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    notificationEmail: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text">Transfer phone (optional)</span>
              <input
                className="input input-bordered"
                value={config.transferPhone ?? ""}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    transferPhone: event.target.value || null,
                  }))
                }
              />
            </label>

            <label className="form-control">
              <span className="label-text">Timezone</span>
              <input
                className="input input-bordered"
                value={config.timezone}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    timezone: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text">FAQ / assistant instructions</span>
            <textarea
              className="textarea textarea-bordered min-h-32"
              value={config.faqScript}
              onChange={(event) =>
                setConfig((previous) => ({
                  ...previous,
                  faqScript: event.target.value,
                }))
              }
            />
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Phone enabled</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.phoneEnabled}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    phoneEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="label cursor-pointer gap-2">
              <span className="label-text">Web chat enabled</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.chatEnabled}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    chatEnabled: event.target.checked,
                  }))
                }
              />
            </label>
          </div>

          <button className="btn btn-primary" disabled={savingConfig}>
            {savingConfig ? "Saving..." : "Save receptionist settings"}
          </button>
        </form>

        {(message || error) && (
          <div
            className={`alert ${error ? "alert-error" : "alert-success"}`}
            role={error ? "alert" : "status"}
            aria-live="polite"
          >
            <span>{error ?? message}</span>
          </div>
        )}
      </div>
    </section>
  );
}
