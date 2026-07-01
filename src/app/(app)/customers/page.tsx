import { Plus } from "lucide-react";
import Link from "next/link";

import { CustomersTable } from "@/components/customers/customers-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/lib/actions/customers";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Accounts you create estimates for."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Customers" },
        ]}
        actions={
          <Button asChild>
            <Link href="/customers/new">
              <Plus />
              New customer
            </Link>
          </Button>
        }
      />
      <CustomersTable customers={customers} />
    </div>
  );
}
