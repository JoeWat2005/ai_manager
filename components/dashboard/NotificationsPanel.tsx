"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="align-top">
                <div className="flex min-w-56 flex-col gap-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              </TableCell>
              <TableCell className="align-top">
                <Badge variant="outline">{item.type}</Badge>
              </TableCell>
              <TableCell className="align-top">
                <Badge
                  variant={
                    item.status === "unread"
                      ? "default"
                      : item.status === "read"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="align-top text-sm text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="align-top">
                <Select
                  value={item.status}
                  disabled={savingId === item.id}
                  onValueChange={(value) =>
                    updateStatus(item.id, value as NotificationStatus)
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
              </TableCell>
            </TableRow>
          ))}
          {notifications.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                No notifications yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
