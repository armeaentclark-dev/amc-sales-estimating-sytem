"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import * as React from "react";

import { DataTable } from "@/components/data-table";
import { SearchBar } from "@/components/search-bar";
import { StatusChip, type StatusTone } from "@/components/status-chip";
import type { customers } from "@/lib/db/schema";

type Customer = typeof customers.$inferSelect;

const STATUS_TONES: Record<Customer["status"], StatusTone> = {
  prospect: "info",
  active: "success",
  inactive: "neutral",
};

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "customerNumber",
    header: "Number",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusChip
        label={row.original.status}
        tone={STATUS_TONES[row.original.status]}
      />
    ),
  },
  {
    accessorKey: "paymentTerms",
    header: "Payment terms",
    cell: ({ row }) => row.original.paymentTerms ?? "—",
  },
];

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.customerNumber.toLowerCase().includes(query),
    );
  }, [customers, search]);

  return (
    <div className="space-y-4">
      <SearchBar
        onValueChange={setSearch}
        placeholder="Search by name or customer number..."
        className="max-w-sm"
      />
      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No customers found"
        emptyDescription="Try a different search, or add a new customer."
      />
    </div>
  );
}
