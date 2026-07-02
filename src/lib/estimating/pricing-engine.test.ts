import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import {
  bomTemplateLines,
  bomTemplates,
  costCategories,
  equipment,
  equipmentTemplateLines,
  equipmentTemplates,
  laborProcesses,
  laborRates,
  laborTemplateLines,
  laborTemplates,
  markupRules,
  materialCategories,
  materials,
  overheadTemplateLines,
  overheadTemplates,
  productCategories,
  productTemplates,
  taxRules,
  uoms,
} from "@/lib/db/schema";

import {
  computeEstimateItemPricing,
  computeProductTemplateCost,
  resolveTaxRatePercent,
} from "./pricing-engine";

// This is an integration test: the pricing engine queries the live DB
// directly (it's not pure), so these tests seed their own uniquely
// named fixtures against the dev Supabase DB and clean up afterward —
// see DECISIONS.md for why (no dedicated test DB provisioned yet).
//
// Fixture numbers mirror what was hand-verified during Phase 8:
// - Material: qty 2 @ $45.50, 5% scrap -> 2 * 45.5 * 1.05 = 95.55
// - Labor: 0.5 hr @ $38/hr -> 19
// - Equipment: 0.25 hr @ $120/hr -> 30
// - Overhead: 15% of labor (percent_of_labor) -> 2.85
// - Total direct cost -> 147.4
// - Markup: 35% (product_category scope) -> listPrice 198.99
// - Tax: 8.25% for jurisdiction "TEST-IL"

const PREFIX = "__vitest__";

const ids: Record<string, string> = {};

beforeAll(async () => {
  const [uom] = await db
    .insert(uoms)
    .values({ code: `${PREFIX}-EA`, name: "Test Each" })
    .returning();
  ids.uom = uom.id;

  const [costCategory] = await db
    .insert(costCategories)
    .values({
      code: `${PREFIX}-CAT`,
      name: "Test Category",
      costType: "material",
    })
    .returning();
  ids.costCategory = costCategory.id;

  const [materialCategory] = await db
    .insert(materialCategories)
    .values({ code: `${PREFIX}-MATCAT`, name: "Test Material Category" })
    .returning();
  ids.materialCategory = materialCategory.id;

  const [productCategory] = await db
    .insert(productCategories)
    .values({ code: `${PREFIX}-PRODCAT`, name: "Test Product Category" })
    .returning();
  ids.productCategory = productCategory.id;

  const [material] = await db
    .insert(materials)
    .values({
      name: `${PREFIX} Steel`,
      materialCategoryId: ids.materialCategory,
      uomId: ids.uom,
      currentUnitCost: "45.5000",
      costCategoryId: ids.costCategory,
    })
    .returning();
  ids.material = material.id;

  const [laborProcess] = await db
    .insert(laborProcesses)
    .values({ name: `${PREFIX} Weld`, costCategoryId: ids.costCategory })
    .returning();
  ids.laborProcess = laborProcess.id;

  await db.insert(laborRates).values({
    laborProcessId: ids.laborProcess,
    ratePerHour: "38.0000",
    effectiveDate: "2020-01-01",
  });

  const [equip] = await db
    .insert(equipment)
    .values({
      name: `${PREFIX} Laser`,
      costCategoryId: ids.costCategory,
      ratePerHour: "120.0000",
    })
    .returning();
  ids.equipment = equip.id;

  const [bomTemplate] = await db
    .insert(bomTemplates)
    .values({ name: `${PREFIX} BOM` })
    .returning();
  ids.bomTemplate = bomTemplate.id;
  await db.insert(bomTemplateLines).values({
    bomTemplateId: ids.bomTemplate,
    materialId: ids.material,
    quantity: "2.0000",
    uomId: ids.uom,
    scrapPercent: "5.0000",
  });

  const [laborTemplate] = await db
    .insert(laborTemplates)
    .values({ name: `${PREFIX} Labor Template` })
    .returning();
  ids.laborTemplate = laborTemplate.id;
  await db.insert(laborTemplateLines).values({
    laborTemplateId: ids.laborTemplate,
    laborProcessId: ids.laborProcess,
    standardHours: "0.5000",
  });

  const [equipmentTemplate] = await db
    .insert(equipmentTemplates)
    .values({ name: `${PREFIX} Equipment Template` })
    .returning();
  ids.equipmentTemplate = equipmentTemplate.id;
  await db.insert(equipmentTemplateLines).values({
    equipmentTemplateId: ids.equipmentTemplate,
    equipmentId: ids.equipment,
    standardHours: "0.2500",
  });

  const [overheadTemplate] = await db
    .insert(overheadTemplates)
    .values({ name: `${PREFIX} Overhead Template` })
    .returning();
  ids.overheadTemplate = overheadTemplate.id;
  await db.insert(overheadTemplateLines).values({
    overheadTemplateId: ids.overheadTemplate,
    costCategoryId: ids.costCategory,
    allocationMethod: "percent_of_labor",
    rate: "15.0000",
  });

  const [productTemplate] = await db
    .insert(productTemplates)
    .values({
      name: `${PREFIX} Product Template`,
      productCategoryId: ids.productCategory,
      bomTemplateId: ids.bomTemplate,
      laborTemplateId: ids.laborTemplate,
      equipmentTemplateId: ids.equipmentTemplate,
      overheadTemplateId: ids.overheadTemplate,
    })
    .returning();
  ids.productTemplate = productTemplate.id;

  await db.insert(markupRules).values({
    scopeType: "product_category",
    scopeId: ids.productCategory,
    markupPercent: "35.0000",
    effectiveDate: "2020-01-01",
  });

  await db.insert(taxRules).values({
    jurisdiction: "TEST-IL",
    ratePercent: "8.2500",
    productCategoryId: ids.productCategory,
  });
});

afterAll(async () => {
  await db.delete(taxRules).where(eq(taxRules.jurisdiction, "TEST-IL"));
  await db
    .delete(markupRules)
    .where(eq(markupRules.scopeId, ids.productCategory));
  await db
    .delete(productTemplates)
    .where(eq(productTemplates.id, ids.productTemplate));
  await db.delete(bomTemplates).where(eq(bomTemplates.id, ids.bomTemplate));
  await db
    .delete(laborTemplates)
    .where(eq(laborTemplates.id, ids.laborTemplate));
  await db
    .delete(equipmentTemplates)
    .where(eq(equipmentTemplates.id, ids.equipmentTemplate));
  await db
    .delete(overheadTemplates)
    .where(eq(overheadTemplates.id, ids.overheadTemplate));
  await db.delete(materials).where(eq(materials.id, ids.material));
  await db
    .delete(laborProcesses)
    .where(eq(laborProcesses.id, ids.laborProcess));
  await db.delete(equipment).where(eq(equipment.id, ids.equipment));
  await db
    .delete(materialCategories)
    .where(eq(materialCategories.id, ids.materialCategory));
  await db
    .delete(productCategories)
    .where(eq(productCategories.id, ids.productCategory));
  await db
    .delete(costCategories)
    .where(eq(costCategories.id, ids.costCategory));
  await db.delete(uoms).where(eq(uoms.id, ids.uom));
});

describe("computeProductTemplateCost", () => {
  it("resolves material/labor/equipment/overhead cost per unit", async () => {
    const costs = await computeProductTemplateCost(ids.productTemplate, null);
    expect(costs.materialCost).toBeCloseTo(95.55, 2);
    expect(costs.laborCost).toBeCloseTo(19, 2);
    expect(costs.equipmentCost).toBeCloseTo(30, 2);
    expect(costs.overheadCost).toBeCloseTo(2.85, 2);
    expect(costs.totalDirectCost).toBeCloseTo(147.4, 2);
    expect(costs.unresolvedLines).toHaveLength(0);
  });
});

describe("computeEstimateItemPricing", () => {
  it("applies markup and produces list/net/extended price at quantity 1", async () => {
    const pricing = await computeEstimateItemPricing({
      productTemplateId: ids.productTemplate,
      quantity: 1,
      customerId: null,
      productCategoryId: ids.productCategory,
      jurisdiction: "TEST-IL",
      manualCostOverride: null,
    });
    expect(pricing.listPrice).toBeCloseTo(198.99, 2);
    expect(pricing.netPrice).toBeCloseTo(198.99, 2);
    expect(pricing.extendedPrice).toBeCloseTo(198.99, 2);
    expect(pricing.marginPercent).not.toBeNull();
    expect((pricing.marginPercent ?? 0) * 100).toBeCloseTo(25.921, 1);
    expect(pricing.markupPercentActual * 100).toBeCloseTo(35, 2);
  });

  it("keeps totalDirectCost per-unit and scales extendedPrice linearly with quantity", async () => {
    const pricing = await computeEstimateItemPricing({
      productTemplateId: ids.productTemplate,
      quantity: 3,
      customerId: null,
      productCategoryId: ids.productCategory,
      jurisdiction: "TEST-IL",
      manualCostOverride: null,
    });
    expect(pricing.totalDirectCost).toBeCloseTo(147.4, 2);
    expect(pricing.extendedPrice).toBeCloseTo(198.99 * 3, 2);
  });

  it("replaces the computed cost when a manual override is set", async () => {
    const pricing = await computeEstimateItemPricing({
      productTemplateId: ids.productTemplate,
      quantity: 1,
      customerId: null,
      productCategoryId: ids.productCategory,
      jurisdiction: "TEST-IL",
      manualCostOverride: 100,
    });
    expect(pricing.totalDirectCost).toBe(100);
    expect(pricing.listPrice).toBeCloseTo(135, 2);
  });
});

describe("resolveTaxRatePercent", () => {
  it("resolves the category-scoped tax rate for a jurisdiction", async () => {
    const rate = await resolveTaxRatePercent(ids.productCategory, "TEST-IL");
    expect((rate ?? 0) * 100).toBeCloseTo(8.25, 2);
  });

  it("returns null when no rule matches the jurisdiction", async () => {
    const rate = await resolveTaxRatePercent(ids.productCategory, "NOWHERE");
    expect(rate).toBeNull();
  });
});
