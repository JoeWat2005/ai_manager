"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NotificationStatus = "unread" | "read" | "archived";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
};

type Props = {
  initialNotifications: NotificationItem[];
};

export function NotificationsPanel({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns: ColumnDef<NotificationItem>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-56 flex-col gap-1">
          <p className="font-semibold">{row.original.title}</p>
          <p className="text-sm text-muted-foreground">{row.original.body}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "unread"
              ? "default"
              : row.original.status === "read"
                ? "secondary"
                : "outline"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorFn: (item) => new Date(item.createdAt).getTime(),
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
    {
      id: "action",
      enableSorting: false,
      header: "Action",
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          disabled={savingId === row.original.id}
          onValueChange={(value) =>
            updateStatus(row.original.id, value as NotificationStatus)
          }
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      ),
    },
  ];

  async function updateStatus(id: string, status: NotificationStatus) {
    setSavingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        notification?: NotificationItem;
      };

      if (!response.ok || !payload.ok || !payload.notification) {
        throw new Error(payload.error ?? "Unable to update notification");
      }

      setNotifications((current) =>
        current.map((item) => (item.id === id ? payload.notification! : item))
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={notifications}
        emptyMessage="No notifications yet."
        initialSorting={[{ id: "createdAt", desc: true }]}
      />

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
