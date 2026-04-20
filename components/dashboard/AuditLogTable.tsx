"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type AuditLogRow = {
  id: string;
  createdAt: string;
  action: string;
  description: string;
  targetType: string | null;
  targetId: string | null;
  actorUserId: string | null;
};

type Props = {
  logs: AuditLogRow[];
};

const columns: ColumnDef<AuditLogRow>[] = [
  {
    accessorFn: (log) => new Date(log.createdAt).getTime(),
    id: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: "action",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
    cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge>,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <div className="max-w-xl whitespace-normal">{row.original.description}</div>
    ),
  },
  {
    accessorFn: (log) =>
      `${log.targetType ?? "-"}${log.targetId ? ` ${log.targetId}` : ""}`,
    id: "target",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Target" />,
    cell: ({ row }) => (
      <span>
        {row.original.targetType ?? "-"}
        {row.original.targetId ? ` (${row.original.targetId.slice(0, 8)}...)` : ""}
      </span>
    ),
  },
  {
    accessorFn: (log) => log.actorUserId ?? "system",
    id: "actor",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Actor" />,
    cell: ({ row }) => row.original.actorUserId ?? "system",
  },
];

export function AuditLogTable({ logs }: Props) {
  return (
    <DataTable
      columns={columns}
      data={logs}
      emptyMessage="No audit events yet."
      initialSorting={[{ id: "createdAt", desc: true }]}
    />
  );
}
