"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

type OrganizationSnapshotRow = {
  id: string;
  name: string;
  slug: string;
  members: number;
  effectivePlan: string;
  paid: boolean;
};

type Props = {
  organizations: OrganizationSnapshotRow[];
};

const columns: ColumnDef<OrganizationSnapshotRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.slug}</span>,
  },
  {
    accessorKey: "members",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Members" />,
  },
  {
    accessorKey: "effectivePlan",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Effective Plan" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.paid ? "default" : "secondary"}>
        {row.original.effectivePlan}
      </Badge>
    ),
  },
];

export function OrganizationSnapshotTable({ organizations }: Props) {
  return (
    <DataTable
      columns={columns}
      data={organizations}
      emptyMessage="No organizations found."
      initialSorting={[{ id: "name", desc: false }]}
    />
  );
}
