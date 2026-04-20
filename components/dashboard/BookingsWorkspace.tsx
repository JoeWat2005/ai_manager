"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type BookingStatus = "confirmed" | "completed" | "canceled" | "no_show";

type BookingRow = {
  id: string;
  contact: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  service: string | null;
  source: "manual" | "chat" | "phone" | "admin";
  status: BookingStatus;
  startAt: string;
  endAt: string;
  staffProfile: {
    id: string;
    displayName: string;
    email: string | null;
  } | null;
};

type BookingSettings = {
  timezone: string;
  slotLengthMinutes: number;
  instantConfirm: boolean;
  autoAssign: boolean;
};

type StaffProfile = {
  id: string;
  displayName: string;
  email: string | null;
  bookable: boolean;
  priority: number;
  timezone: string;
  availabilities: Array<{
    id: string;
    weekday: number;
    startMinutes: number;
    endMinutes: number;
    isEnabled: boolean;
  }>;
};

type Props = {
  slug: string;
  initialBookings: BookingRow[];
  initialSettings: BookingSettings;
  initialStaffProfiles: StaffProfile[];
};

const STATUS_OPTIONS: BookingStatus[] = ["confirmed", "completed", "canceled", "no_show"];

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  canceled: "Canceled",
  no_show: "No show",
};

export function BookingsWorkspace({
  slug,
  initialBookings,
  initialSettings,
  initialStaffProfiles,
}: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [settings, setSettings] = useState(initialSettings);
  const [staffProfiles, setStaffProfiles] = useState(initialStaffProfiles);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    service: "",
    notes: "",
    requestedStartAt: "",
    preferredStaffId: "",
  });

  const nextBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
        .slice(0, 12),
    [bookings]
  );

  const staffColumns = useMemo<ColumnDef<StaffProfile>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Staff" />
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-semibold">{row.original.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.email ?? "No email"}
            </p>
          </div>
        ),
      },
      {
        accessorFn: (profile) => (profile.bookable ? 1 : 0),
        id: "bookable",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Bookable" />
        ),
        cell: ({ row }) => (
          <Switch
            checked={row.original.bookable}
            onCheckedChange={(checked) =>
              updateStaffProfile(row.original.id, { bookable: checked })
            }
          />
        ),
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Priority" />
        ),
        cell: ({ row }) => (
          <Input
            type="number"
            className="w-20"
            value={row.original.priority}
            onChange={(event) =>
              updateStaffProfile(row.original.id, {
                priority: Number(event.target.value),
              })
            }
          />
        ),
      },
      {
        accessorKey: "timezone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Timezone" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.timezone}</span>
        ),
      },
    ],
    []
  );

  const bookingColumns = useMemo<ColumnDef<BookingRow>[]>(
    () => [
      {
        accessorFn: (booking) => booking.contact.name ?? "Unknown contact",
        id: "customer",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Customer" />
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-semibold">
              {row.original.contact.name ?? "Unknown contact"}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.contact.phone ?? row.original.contact.email ?? "No contact"}
            </p>
          </div>
        ),
      },
      {
        accessorFn: (booking) => booking.service ?? "General",
        id: "service",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Service" />
        ),
        cell: ({ row }) => row.original.service ?? "General",
      },
      {
        accessorFn: (booking) => booking.staffProfile?.displayName ?? "Unassigned",
        id: "assignedStaff",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assigned staff" />
        ),
        cell: ({ row }) => row.original.staffProfile?.displayName ?? "Unassigned",
      },
      {
        accessorFn: (booking) => new Date(booking.startAt).getTime(),
        id: "startAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Start" />
        ),
        cell: ({ row }) => new Date(row.original.startAt).toLocaleString(),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Select
            value={row.original.status}
            onValueChange={(value) =>
              updateBookingStatus(row.original.id, value as BookingStatus)
            }
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ),
      },
    ],
    []
  );

  async function createBooking(event: React.FormEvent) {
    event.preventDefault();

    if (!form.customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    setSaving(true);

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
          notes: form.notes || undefined,
          requestedStartAt: form.requestedStartAt
            ? new Date(form.requestedStartAt).toISOString()
            : undefined,
          preferredStaffId: form.preferredStaffId || undefined,
          source: "manual",
          timezone: settings.timezone,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        booking?: BookingRow;
      };

      if (!response.ok || !payload.ok || !payload.booking) {
        throw new Error(payload.error ?? "Unable to create booking");
      }

      setBookings((current) => [payload.booking!, ...current]);
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        service: "",
        notes: "",
        requestedStartAt: "",
        preferredStaffId: "",
      });
      toast.success("Booking confirmed and auto-assigned.");
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Booking creation failed"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    setSaving(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        booking?: BookingRow;
      };

      if (!response.ok || !payload.ok || !payload.booking) {
        throw new Error(payload.error ?? "Unable to update booking status");
      }

      setBookings((current) =>
        current.map((b) => (b.id === bookingId ? payload.booking! : b))
      );
      toast.success("Booking status updated.");
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);

    try {
      const response = await fetch("/api/bookings/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        settings?: BookingSettings;
      };

      if (!response.ok || !payload.ok || !payload.settings) {
        throw new Error(payload.error ?? "Unable to save booking settings");
      }

      setSettings(payload.settings);
      toast.success("Booking settings saved.");
    } catch (settingsError) {
      toast.error(
        settingsError instanceof Error ? settingsError.message : "Settings save failed"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStaffProfile(
    profileId: string,
    updates: Partial<Pick<StaffProfile, "bookable" | "priority" | "timezone">>
  ) {
    setSaving(true);

    try {
      const response = await fetch(`/api/bookings/staff/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        profile?: StaffProfile;
      };

      if (!response.ok || !payload.ok || !payload.profile) {
        throw new Error(payload.error ?? "Unable to update staff profile");
      }

      setStaffProfiles((current) =>
        current.map((p) => (p.id === profileId ? { ...p, ...payload.profile! } : p))
      );
      toast.success("Staff profile updated.");
    } catch (staffError) {
      toast.error(staffError instanceof Error ? staffError.message : "Staff update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Create booking */}
        <Card>
          <CardHeader>
            <CardTitle>Create manual booking</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={createBooking}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customerName">Customer name</Label>
                  <Input
                    id="customerName"
                    value={form.customerName}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, customerName: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="service">Service</Label>
                  <Input
                    id="service"
                    value={form.service}
                    onChange={(e) => setForm((c) => ({ ...c, service: e.target.value }))}
                    placeholder="Consultation"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, customerEmail: e.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={form.customerPhone}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, customerPhone: e.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="requestedStartAt">Preferred date & time</Label>
                  <Input
                    id="requestedStartAt"
                    type="datetime-local"
                    value={form.requestedStartAt}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, requestedStartAt: e.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label>Preferred staff (optional)</Label>
                  <Select
                    value={form.preferredStaffId || "auto"}
                    onValueChange={(value) =>
                      setForm((c) => ({
                        ...c,
                        preferredStaffId: !value || value === "auto" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="auto">Auto-assign best available</SelectItem>
                        {staffProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.displayName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="self-start">
                {saving ? "Creating..." : "Create booking"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Booking settings */}
        <Card>
          <CardHeader>
            <CardTitle>Booking settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={saveSettings}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings((c) => ({ ...c, timezone: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slotLength">Slot length (minutes)</Label>
                <Input
                  id="slotLength"
                  type="number"
                  min={15}
                  max={120}
                  value={settings.slotLengthMinutes}
                  onChange={(e) =>
                    setSettings((c) => ({
                      ...c,
                      slotLengthMinutes: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="instantConfirm"
                  checked={settings.instantConfirm}
                  onCheckedChange={(checked) =>
                    setSettings((c) => ({ ...c, instantConfirm: checked }))
                  }
                />
                <Label htmlFor="instantConfirm">Instant confirmation</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="autoAssign"
                  checked={settings.autoAssign}
                  onCheckedChange={(checked) =>
                    setSettings((c) => ({ ...c, autoAssign: checked }))
                  }
                />
                <Label htmlFor="autoAssign">Auto-assign best available staff</Label>
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={saving}
                className="self-start"
              >
                {saving ? "Saving..." : "Save booking settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Staff profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Bookable staff profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={staffColumns}
            data={staffProfiles}
            emptyMessage="No staff profiles available yet."
            initialSorting={[{ id: "priority", desc: false }]}
          />
        </CardContent>
      </Card>

      {/* Upcoming bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={bookingColumns}
            data={nextBookings}
            emptyMessage="No bookings yet."
            initialSorting={[{ id: "startAt", desc: false }]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
