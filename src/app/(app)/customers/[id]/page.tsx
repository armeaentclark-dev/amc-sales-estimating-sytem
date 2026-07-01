import { notFound } from "next/navigation";

import { AddressesSection } from "@/components/customers/addresses-section";
import { ContactsSection } from "@/components/customers/contacts-section";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/page-header";
import { getCustomer } from "@/lib/actions/customers";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={customer.name}
        description={customer.customerNumber}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Customers", href: "/customers" },
          { label: customer.name },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerForm customer={customer} />
        <div className="space-y-6">
          <ContactsSection
            customerId={customer.id}
            contacts={customer.contacts}
          />
          <AddressesSection
            customerId={customer.id}
            addresses={customer.addresses}
          />
        </div>
      </div>
    </div>
  );
}
