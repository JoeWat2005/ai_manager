"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Bookable</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Timezone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <p className="font-semibold">{profile.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.email ?? "No email"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={profile.bookable}
                      onCheckedChange={(checked) =>
                        updateStaffProfile(profile.id, { bookable: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20"
                      value={profile.priority}
                      onChange={(e) =>
                        updateStaffProfile(profile.id, {
                          priority: Number(e.target.value),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {profile.timezone}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Assigned staff</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nextBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <p className="font-semibold">{booking.contact.name ?? "Unknown contact"}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.contact.phone ?? booking.contact.email ?? "No contact"}
                    </p>
                  </TableCell>
                  <TableCell>{booking.service ?? "General"}</TableCell>
                  <TableCell>
                    {booking.staffProfile?.displayName ?? "Unassigned"}
                  </TableCell>
                  <TableCell>{new Date(booking.startAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Select
                      value={booking.status}
                      onValueChange={(value) =>
                        updateBookingStatus(booking.id, value as BookingStatus)
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
                  </TableCell>
                </TableRow>
              ))}
              {nextBookings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No bookings yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
