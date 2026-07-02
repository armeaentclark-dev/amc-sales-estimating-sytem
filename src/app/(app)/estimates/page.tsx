import { Plus } from "lucide-react";
import Link from "next/link";

import { EstimatesTable } from "@/components/estimates/estimates-table";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getEstimates } from "@/lib/actions/estimates";

export default async function EstimatesPage() {
  const estimates = await getEstimates();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Estimates"
        description="Quotes you're building or have sent to customers."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Estimates" },
        ]}
        actions={
          <Button asChild>
            <Link href="/estimates/new">
              <Plus />
              New estimate
            </Link>
          </Button>
        }
      />
      <EstimatesTable estimates={estimates} />
    </div>
  );
}
