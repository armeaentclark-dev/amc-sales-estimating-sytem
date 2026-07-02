"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import * as React from "react";

import { DataTable } from "@/components/data-table";
import { SearchBar } from "@/components/search-bar";
import { StatusChip, type StatusTone } from "@/components/status-chip";
import type { getEstimates } from "@/lib/actions/estimates";

type Estimate = Awaited<ReturnType<typeof getEstimates>>[number];

const STATUS_TONES: Record<string, StatusTone> = {
  draft: "neutral",
  in_review: "info",
  approved: "info",
  rejected: "danger",
  sent: "info",
  won: "success",
  lost: "danger",
  expired: "warning",
  voided: "neutral",
  converted: "success",
};

const columns: ColumnDef<Estimate>[] = [
  { accessorKey: "estimateNumber", header: "Number" },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/estimates/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customer.name,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const current = row.original.revisions[0];
      if (!current) return "—";
      return (
        <StatusChip
          label={`R${current.revisionNumber} · ${current.status.label}`}
          tone={STATUS_TONES[current.status.code] ?? "neutral"}
        />
      );
    },
  },
  {
    id: "salesperson",
    header: "Salesperson",
    cell: ({ row }) =>
      row.original.salesperson.fullName ?? row.original.salesperson.email,
  },
];

interface EstimatesTableProps {
  estimates: Estimate[];
}

export function EstimatesTable({ estimates }: EstimatesTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return estimates;
    return estimates.filter(
      (estimate) =>
        estimate.title.toLowerCase().includes(query) ||
        estimate.estimateNumber.toLowerCase().includes(query) ||
        estimate.customer.name.toLowerCase().includes(query),
    );
  }, [estimates, search]);

  return (
    <div className="space-y-4">
      <SearchBar
        onValueChange={setSearch}
        placeholder="Search by number, title, or customer..."
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No estimates found"
        emptyDescription="Try a different search, or create a new estimate."
      />
    </div>
  );
}
