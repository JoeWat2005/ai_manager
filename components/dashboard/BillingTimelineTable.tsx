"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type BillingTimelineItem = {
  id: string;
  plan: string;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
};

type Props = {
  items: BillingTimelineItem[];
};

const columns: ColumnDef<BillingTimelineItem>[] = [
  {
    accessorKey: "plan",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorFn: (item) => {
      if (!item.periodStart) return 0;
      return new Date(item.periodStart).getTime();
    },
    id: "period",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
    cell: ({ row }) => (
      <span>
        {row.original.periodStart
          ? new Date(row.original.periodStart).toLocaleDateString()
          : "-"}{" "}
        -{" "}
        {row.original.periodEnd
          ? new Date(row.original.periodEnd).toLocaleDateString()
          : "-"}
      </span>
    ),
  },
];

export function BillingTimelineTable({ items }: Props) {
  return (
    <DataTable
      columns={columns}
      data={items}
      emptyMessage="No subscription events synced yet."
      initialSorting={[{ id: "period", desc: true }]}
    />
  );
}
