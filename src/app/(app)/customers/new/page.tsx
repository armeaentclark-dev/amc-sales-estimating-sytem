import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/page-header";

export default function NewCustomerPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="New customer"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Customers", href: "/customers" },
          { label: "New" },
        ]}
      />
      <CustomerForm />
    </div>
  );
}
