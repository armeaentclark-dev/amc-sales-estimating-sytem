import { Layers } from "lucide-react";
import Link from "next/link";

import { EquipmentPanel } from "@/components/cost-library/equipment-panel";
import { LaborPanel } from "@/components/cost-library/labor-panel";
import { MaterialPanel } from "@/components/cost-library/material-panel";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getEquipment,
  getLaborProcesses,
  getMaterials,
} from "@/lib/actions/cost-library";
import {
  getCostCategories,
  getMaterialCategories,
  getUoms,
} from "@/lib/actions/reference-data";

export default async function CostLibraryPage() {
  const [
    materials,
    laborProcesses,
    equipmentItems,
    costCategories,
    materialCategories,
    uoms,
  ] = await Promise.all([
    getMaterials(),
    getLaborProcesses(),
    getEquipment(),
    getCostCategories(),
    getMaterialCategories(),
    getUoms(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Cost Library"
        description="Materials, labor, and equipment costing used to price products."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cost Library" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/cost-library/templates">
              <Layers />
              Templates
            </Link>
          </Button>
        }
      />
      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <MaterialPanel
            items={materials}
            materialCategories={materialCategories}
            uoms={uoms}
            costCategories={costCategories}
          />
        </TabsContent>
        <TabsContent value="labor">
          <LaborPanel items={laborProcesses} costCategories={costCategories} />
        </TabsContent>
        <TabsContent value="equipment">
          <EquipmentPanel
            items={equipmentItems}
            costCategories={costCategories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
