import { ProductPanel } from "@/components/products/product-panel";
import { ProductTemplatePanel } from "@/components/products/product-template-panel";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getBomTemplates,
  getEquipmentTemplates,
  getLaborTemplates,
  getOverheadTemplates,
} from "@/lib/actions/cost-library-templates";
import { getProductTemplates, getProducts } from "@/lib/actions/products";
import { getProductCategories } from "@/lib/actions/reference-data";

export default async function ProductsPage() {
  const [
    productTemplates,
    products,
    productCategories,
    bomTemplates,
    laborTemplates,
    equipmentTemplates,
    overheadTemplates,
  ] = await Promise.all([
    getProductTemplates(),
    getProducts(),
    getProductCategories(),
    getBomTemplates(),
    getLaborTemplates(),
    getEquipmentTemplates(),
    getOverheadTemplates(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Products"
        description="Sellable products and the templates that compose their cost."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Products" }]}
      />
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Product templates</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <ProductTemplatePanel
            items={productTemplates}
            productCategories={productCategories}
            bomTemplates={bomTemplates}
            laborTemplates={laborTemplates}
            equipmentTemplates={equipmentTemplates}
            overheadTemplates={overheadTemplates}
          />
        </TabsContent>
        <TabsContent value="products">
          <ProductPanel
            items={products}
            productCategories={productCategories}
            productTemplates={productTemplates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
