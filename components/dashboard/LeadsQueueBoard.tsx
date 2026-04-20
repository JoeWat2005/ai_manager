"use client";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Callback</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="align-top">
                    <div className="flex min-w-44 flex-col gap-1">
                      <p className="font-semibold">
                        {lead.contact?.name ?? "Unknown caller"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.contact?.phone ?? lead.contact?.email ?? "Missing contact"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={lead.channel === "phone" ? "outline" : "secondary"}>
                      {lead.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-sm align-top whitespace-normal text-sm text-muted-foreground">
                    {lead.intent ?? "No intent captured"}
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {lead.preferredCallbackWindow ?? "No preference"}
                  </TableCell>
                  <TableCell className="align-top">
                    <Select
                      value={lead.status}
                      disabled={savingLeadId === lead.id}
                      onValueChange={(value) =>
                        updateLeadStatus(lead.id, value as LeadStatus)
                      }
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
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No leads match your filters yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
