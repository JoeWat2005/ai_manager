"use client";

import { useMemo, useState } from "react";

type LeadStatus = "new" | "contacted" | "closed";

type Lead = {
  id: string;
  channel: "phone" | "web";
  name: string | null;
  phone: string | null;
  intent: string | null;
  preferredCallbackWindow: string | null;
  qualified: boolean;
  status: LeadStatus;
  createdAt: string;
};

type Props = {
  initialLeads: Lead[];
};

export function LeadsQueueBoard({ initialLeads }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        (lead.name ?? "").toLowerCase().includes(normalizedQuery) ||
        (lead.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        (lead.intent ?? "").toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [leads, query, statusFilter]);

  const metrics = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((lead) => lead.status === "new").length;
    const contactedCount = leads.filter((lead) => lead.status === "contacted").length;
    const qualifiedCount = leads.filter((lead) => lead.qualified).length;

    return { total, newCount, contactedCount, qualifiedCount };
  }, [leads]);

  async function updateLeadStatus(leadId: string, status: LeadStatus) {
    setSavingLeadId(leadId);
    setError(null);

    try {
      const response = await fetch(`/api/reception/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        lead?: Lead;
      };

      if (!response.ok || !payload.ok || !payload.lead) {
        throw new Error(payload.error ?? "Failed to update lead status");
      }

      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? payload.lead! : lead)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update lead");
    } finally {
      setSavingLeadId(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Total leads
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{metrics.total}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            New
          </p>
          <p className="mt-1 text-2xl font-black text-primary">{metrics.newCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Contacted
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{metrics.contactedCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Qualified
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{metrics.qualifiedCount}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-base-100 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-3">
          <label className="input input-bordered flex items-center gap-2 grow md:max-w-md">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-slate-500"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m21 21-4.2-4.2m1.7-5.1a6.8 6.8 0 1 1-13.6 0 6.8 6.8 0 0 1 13.6 0Z"
                className="stroke-current"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              aria-label="Search leads by name, phone, or intent"
              placeholder="Search name, phone, or intent..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="form-control w-full md:w-56">
            <select
              className="select select-bordered"
              aria-label="Filter leads by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "all")}
            >
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Channel</th>
                <th>Intent</th>
                <th>Callback</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="min-w-40">
                      <p className="font-semibold">{lead.name ?? "Unknown caller"}</p>
                      <p className="text-xs text-slate-500">{lead.phone ?? "Missing phone"}</p>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-outline capitalize ${
                        lead.channel === "phone" ? "badge-primary" : "badge-secondary"
                      }`.trim()}
                    >
                      {lead.channel}
                    </span>
                  </td>
                  <td className="max-w-sm">
                    <p className="line-clamp-2 text-sm text-slate-700">
                      {lead.intent ?? "No intent captured"}
                    </p>
                  </td>
                  <td className="text-sm text-slate-700">
                    {lead.preferredCallbackWindow ?? "No preference"}
                  </td>
                  <td>
                    <select
                      className="select select-bordered select-sm w-32"
                      aria-label={`Update status for lead ${lead.id}`}
                      value={lead.status}
                      disabled={savingLeadId === lead.id}
                      onChange={(event) =>
                        updateLeadStatus(lead.id, event.target.value as LeadStatus)
                      }
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                  <td className="text-sm text-slate-700">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    No leads match your filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
