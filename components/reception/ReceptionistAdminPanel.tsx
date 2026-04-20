"use client";

import { useMemo, useState } from "react";

type ReceptionistConfig = {
  phoneExtension: string;
  notificationEmail: string;
  faqScript: string;
  transferPhone: string | null;
  phoneEnabled: boolean;
  chatEnabled: boolean;
  timezone: string;
};

type ReceptionLead = {
  id: string;
  channel: "phone" | "web";
  name: string | null;
  phone: string | null;
  intent: string | null;
  preferredCallbackWindow: string | null;
  status: "new" | "contacted" | "closed";
  qualified: boolean;
  createdAt: string;
};

type Props = {
  initialConfig: ReceptionistConfig;
  initialLeads: ReceptionLead[];
};

export function ReceptionistAdminPanel({ initialConfig, initialLeads }: Props) {
  const [config, setConfig] = useState<ReceptionistConfig>(initialConfig);
  const [leads, setLeads] = useState(initialLeads);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedLeads = useMemo(
    () =>
      [...leads].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [leads]
  );

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/reception/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        config?: ReceptionistConfig;
      };
      if (!response.ok || !data.ok || !data.config) {
        throw new Error(data.error ?? "Failed to save config");
      }

      setConfig({
        ...data.config,
      });
      setMessage("Receptionist settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSavingConfig(false);
    }
  }

  async function updateLeadStatus(id: string, status: "new" | "contacted" | "closed") {
    setError(null);
    try {
      const response = await fetch(`/api/reception/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        lead?: ReceptionLead;
      };
      if (!response.ok || !data.ok || !data.lead) {
        throw new Error(data.error ?? "Failed to update lead");
      }
      setLeads((prev) => prev.map((lead) => (lead.id === id ? data.lead! : lead)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Receptionist Settings</h2>
        <p className="mb-4 text-sm text-slate-600">
          Configure your shared phone routing, FAQ behavior, and callback notifications.
        </p>

        <form onSubmit={saveConfig} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="form-control">
              <span className="label-text">4-digit phone extension</span>
              <input
                className="input input-bordered"
                value={config.phoneExtension}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, phoneExtension: e.target.value }))
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
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, notificationEmail: e.target.value }))
                }
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text">Transfer phone (optional)</span>
              <input
                className="input input-bordered"
                value={config.transferPhone ?? ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    transferPhone: e.target.value || null,
                  }))
                }
              />
            </label>

            <label className="form-control">
              <span className="label-text">Timezone</span>
              <input
                className="input input-bordered"
                value={config.timezone}
                onChange={(e) => setConfig((prev) => ({ ...prev, timezone: e.target.value }))}
                required
              />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text">FAQ / assistant instructions</span>
            <textarea
              className="textarea textarea-bordered min-h-32"
              value={config.faqScript}
              onChange={(e) => setConfig((prev) => ({ ...prev, faqScript: e.target.value }))}
            />
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Phone enabled</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.phoneEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, phoneEnabled: e.target.checked }))
                }
              />
            </label>

            <label className="label cursor-pointer gap-2">
              <span className="label-text">Web chat enabled</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.chatEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, chatEnabled: e.target.checked }))
                }
              />
            </label>
          </div>

          <button className="btn btn-primary" disabled={savingConfig}>
            {savingConfig ? "Saving..." : "Save settings"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-base-100 p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Lead Queue</h2>
        <p className="mb-4 text-sm text-slate-600">
          Qualified and in-progress inbound receptionist leads.
        </p>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Intent</th>
                <th>Callback window</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <span className="badge badge-outline capitalize">{lead.channel}</span>
                  </td>
                  <td>{lead.name ?? "Unknown"}</td>
                  <td>{lead.phone ?? "Missing"}</td>
                  <td className="max-w-xs truncate" title={lead.intent ?? ""}>
                    {lead.intent ?? "Missing"}
                  </td>
                  <td>{lead.preferredCallbackWindow ?? "Not specified"}</td>
                  <td>
                    <select
                      className="select select-bordered select-sm"
                      aria-label={`Update status for lead ${lead.id}`}
                      value={lead.status}
                      onChange={(e) =>
                        updateLeadStatus(
                          lead.id,
                          e.target.value as "new" | "contacted" | "closed"
                        )
                      }
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                  <td>{new Date(lead.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {sortedLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-sm opacity-70">
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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
  );
}
