import { BomTemplatePanel } from "@/components/cost-library/bom-template-panel";
import { EquipmentTemplatePanel } from "@/components/cost-library/equipment-template-panel";
import { LaborTemplatePanel } from "@/components/cost-library/labor-template-panel";
import { OverheadTemplatePanel } from "@/components/cost-library/overhead-template-panel";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getBomTemplates,
  getEquipmentTemplates,
  getLaborTemplates,
  getOverheadTemplates,
} from "@/lib/actions/cost-library-templates";
import {
  getEquipment,
  getLaborProcesses,
  getMaterials,
} from "@/lib/actions/cost-library";
import { getCostCategories, getUoms } from "@/lib/actions/reference-data";

export default async function CostLibraryTemplatesPage() {
  const [
    bomTemplates,
    laborTemplates,
    equipmentTemplates,
    overheadTemplates,
    materials,
    uoms,
    laborProcesses,
    equipmentItems,
    costCategories,
  ] = await Promise.all([
    getBomTemplates(),
    getLaborTemplates(),
    getEquipmentTemplates(),
    getOverheadTemplates(),
    getMaterials(),
    getUoms(),
    getLaborProcesses(),
    getEquipment(),
    getCostCategories(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Cost Library Templates"
        description="Reusable BOM, labor, equipment, and overhead recipes composed by Product Templates."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cost Library", href: "/cost-library" },
          { label: "Templates" },
        ]}
      />
      <Tabs defaultValue="bom">
        <TabsList>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="overhead">Overhead</TabsTrigger>
        </TabsList>
        <TabsContent value="bom">
          <BomTemplatePanel
            items={bomTemplates}
            materials={materials}
            uoms={uoms}
          />
        </TabsContent>
        <TabsContent value="labor">
          <LaborTemplatePanel
            items={laborTemplates}
            laborProcesses={laborProcesses}
          />
        </TabsContent>
        <TabsContent value="equipment">
          <EquipmentTemplatePanel
            items={equipmentTemplates}
            equipment={equipmentItems}
          />
        </TabsContent>
        <TabsContent value="overhead">
          <OverheadTemplatePanel
            items={overheadTemplates}
            costCategories={costCategories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
