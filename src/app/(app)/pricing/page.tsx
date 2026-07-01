import { ApprovalThresholdPanel } from "@/components/pricing/approval-threshold-panel";
import { CustomerPricingAgreementPanel } from "@/components/pricing/customer-pricing-agreement-panel";
import { DiscountRulePanel } from "@/components/pricing/discount-rule-panel";
import { MarkupRulePanel } from "@/components/pricing/markup-rule-panel";
import { TaxRulePanel } from "@/components/pricing/tax-rule-panel";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCustomers } from "@/lib/actions/customers";
import { getLaborProcesses, getMaterials } from "@/lib/actions/cost-library";
import {
  getApprovalThresholds,
  getCustomerPricingAgreements,
  getDiscountRules,
  getMarkupRules,
  getTaxRules,
} from "@/lib/actions/pricing";
import { getProductCategories } from "@/lib/actions/reference-data";
import { getProductTemplates } from "@/lib/actions/products";

export default async function PricingPage() {
  const [
    markupRules,
    discountRules,
    taxRules,
    agreements,
    thresholds,
    productCategories,
    productTemplates,
    customers,
    materials,
    laborProcesses,
  ] = await Promise.all([
    getMarkupRules(),
    getDiscountRules(),
    getTaxRules(),
    getCustomerPricingAgreements(),
    getApprovalThresholds(),
    getProductCategories(),
    getProductTemplates(),
    getCustomers(),
    getMaterials(),
    getLaborProcesses(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Pricing Rules"
        description="Markup, discount, and tax rules, plus customer-specific pricing and approval thresholds."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Pricing Rules" },
        ]}
      />
      <Tabs defaultValue="markup">
        <TabsList>
          <TabsTrigger value="markup">Markup</TabsTrigger>
          <TabsTrigger value="discount">Discount</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="agreements">Customer agreements</TabsTrigger>
          <TabsTrigger value="thresholds">Approval thresholds</TabsTrigger>
        </TabsList>
        <TabsContent value="markup">
          <MarkupRulePanel
            items={markupRules}
            productCategories={productCategories}
            productTemplates={productTemplates}
            customers={customers}
          />
        </TabsContent>
        <TabsContent value="discount">
          <DiscountRulePanel items={discountRules} customers={customers} />
        </TabsContent>
        <TabsContent value="tax">
          <TaxRulePanel
            items={taxRules}
            productCategories={productCategories}
          />
        </TabsContent>
        <TabsContent value="agreements">
          <CustomerPricingAgreementPanel
            items={agreements}
            customers={customers}
            materials={materials}
            laborProcesses={laborProcesses}
          />
        </TabsContent>
        <TabsContent value="thresholds">
          <ApprovalThresholdPanel
            items={thresholds}
            productCategories={productCategories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
