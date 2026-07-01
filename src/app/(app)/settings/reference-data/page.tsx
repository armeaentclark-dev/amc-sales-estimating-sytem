import { CostCategoryPanel } from "@/components/reference-data/cost-category-panel";
import { MaterialCategoryPanel } from "@/components/reference-data/material-category-panel";
import { ProductCategoryPanel } from "@/components/reference-data/product-category-panel";
import { UomPanel } from "@/components/reference-data/uom-panel";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCostCategories,
  getMaterialCategories,
  getProductCategories,
  getUoms,
} from "@/lib/actions/reference-data";

export default async function ReferenceDataPage() {
  const [uoms, costCategories, materialCategories, productCategories] =
    await Promise.all([
      getUoms(),
      getCostCategories(),
      getMaterialCategories(),
      getProductCategories(),
    ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Reference Data"
        description="Shared lookups used across the Cost Library and Product catalog."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
          { label: "Reference Data" },
        ]}
      />
      <Tabs defaultValue="uom">
        <TabsList>
          <TabsTrigger value="uom">Units of measure</TabsTrigger>
          <TabsTrigger value="cost-categories">Cost categories</TabsTrigger>
          <TabsTrigger value="material-categories">
            Material categories
          </TabsTrigger>
          <TabsTrigger value="product-categories">
            Product categories
          </TabsTrigger>
        </TabsList>
        <TabsContent value="uom">
          <UomPanel items={uoms} />
        </TabsContent>
        <TabsContent value="cost-categories">
          <CostCategoryPanel items={costCategories} />
        </TabsContent>
        <TabsContent value="material-categories">
          <MaterialCategoryPanel items={materialCategories} />
        </TabsContent>
        <TabsContent value="product-categories">
          <ProductCategoryPanel items={productCategories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
