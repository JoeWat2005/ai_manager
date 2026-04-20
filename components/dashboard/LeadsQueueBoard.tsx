"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type LeadStatus = "new" | "contacted" | "closed";

type Lead = {
  id: string;
  channel: "phone" | "web";
  contact: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  intent: string | null;
  preferredCallbackWindow: string | null;
  qualified: boolean;
  status: LeadStatus;
  createdAt: string;
};

type Props = {
  initialLeads: Lead[];
};

const STATUS_OPTIONS: Array<LeadStatus | "all"> = ["all", "new", "contacted", "closed"];

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
        (lead.contact?.name ?? "").toLowerCase().includes(normalizedQuery) ||
        (lead.contact?.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        (lead.contact?.email ?? "").toLowerCase().includes(normalizedQuery) ||
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

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorFn: (lead) => lead.contact?.name ?? "Unknown caller",
        id: "lead",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lead" />
        ),
        cell: ({ row }) => {
          const lead = row.original;

          return (
            <div className="flex min-w-44 flex-col gap-1">
              <p className="font-semibold">{lead.contact?.name ?? "Unknown caller"}</p>
              <p className="text-xs text-muted-foreground">
                {lead.contact?.phone ?? lead.contact?.email ?? "Missing contact"}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "channel",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Channel" />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.channel === "phone" ? "outline" : "secondary"}
          >
            {row.original.channel}
          </Badge>
        ),
      },
      {
        accessorFn: (lead) => lead.intent ?? "No intent captured",
        id: "intent",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Intent" />
        ),
        cell: ({ row }) => (
          <div className="max-w-sm whitespace-normal text-sm text-muted-foreground">
            {row.original.intent ?? "No intent captured"}
          </div>
        ),
      },
      {
        accessorFn: (lead) => lead.preferredCallbackWindow ?? "No preference",
        id: "callback",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Callback" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.preferredCallbackWindow ?? "No preference"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const lead = row.original;

          return (
            <Select
              value={lead.status}
              disabled={savingLeadId === lead.id}
              onValueChange={(value) => updateLeadStatus(lead.id, value as LeadStatus)}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorFn: (lead) => new Date(lead.createdAt).getTime(),
        id: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleString()}
          </span>
        ),
      },
    ],
    [savingLeadId]
  );

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
    <div className="flex flex-col gap-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total leads</CardDescription>
            <CardTitle className="text-2xl font-black">{metrics.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>New</CardDescription>
            <CardTitle className="text-2xl font-black text-primary">{metrics.newCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Contacted</CardDescription>
            <CardTitle className="text-2xl font-black">{metrics.contactedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Qualified</CardDescription>
            <CardTitle className="text-2xl font-black">{metrics.qualifiedCount}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Lead queue</CardTitle>
            <CardDescription>Search by caller, contact detail, or intent.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Input
              aria-label="Search leads by name, phone, email, or intent"
              className="md:w-80"
              placeholder="Search name, phone, email, or intent"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all"
                        ? "All statuses"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredLeads}
            emptyMessage="No leads match your filters yet."
            initialSorting={[{ id: "createdAt", desc: true }]}
          />

          {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
