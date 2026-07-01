import { FileText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your estimates and activity."
        breadcrumbs={[{ label: "Dashboard" }]}
      />
      <EmptyState
        icon={FileText}
        title="No estimates yet"
        description="Once the estimating module ships, your recent estimates and activity will show up here."
      />
    </div>
  );
}
