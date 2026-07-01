import { PageHeader } from "@/components/page-header";
import { getOrganizationSettings } from "@/lib/actions/organization-settings";

import { CompanySettingsForm } from "./company-settings-form";

export default async function CompanySettingsPage() {
  const settings = await getOrganizationSettings();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Company"
        description="AMC's organization profile, used across the platform."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
          { label: "Company" },
        ]}
      />
      <CompanySettingsForm settings={settings} />
    </div>
  );
}
