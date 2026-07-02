import { EstimateForm } from "@/components/estimates/estimate-form";
import { PageHeader } from "@/components/page-header";
import { getCustomers } from "@/lib/actions/customers";
import { getUsers } from "@/lib/actions/users";

export default async function NewEstimatePage() {
  const [customers, users] = await Promise.all([getCustomers(), getUsers()]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="New estimate"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Estimates", href: "/estimates" },
          { label: "New" },
        ]}
      />
      <EstimateForm customers={customers} salespeople={users} />
    </div>
  );
}
