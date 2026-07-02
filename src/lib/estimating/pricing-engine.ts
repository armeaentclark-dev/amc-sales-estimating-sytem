import { and, eq, gte, isNull, lte, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  customerPricingAgreements,
  discountRules,
  laborProcesses,
  laborRates,
  markupRules,
  materialCategories,
  materials,
  productTemplates,
  taxRules,
} from "@/lib/db/schema";

// All percent-shaped DB columns (markup_percent, scrap_percent,
// discount_percent, rate_percent, target_margin_percent) store the
// human number, e.g. "35.0000" means 35% — divide by 100 before use
// in a formula. This module is the single place that does that
// conversion; callers should never do it themselves.
const pct = (value: string | null) =>
  value === null ? null : Number(value) / 100;
const num = (value: string | number | null) =>
  value === null ? 0 : Number(value);

const today = () => new Date().toISOString().slice(0, 10);

export interface CostResolution {
  amount: number | null;
  source: string;
}

// DOMAIN_MODEL.md §3.7 Material pricing hierarchy (most specific
// wins). Level 1 (manual override) is handled by the caller, not
// here — it never needs a DB lookup.
export async function resolveMaterialCost(
  materialId: string,
  customerId: string | null,
): Promise<CostResolution> {
  const asOf = today();

  if (customerId) {
    const [agreement] = await db
      .select()
      .from(customerPricingAgreements)
      .where(
        and(
          eq(customerPricingAgreements.customerId, customerId),
          eq(customerPricingAgreements.scopeType, "material"),
          eq(customerPricingAgreements.scopeId, materialId),
          lte(customerPricingAgreements.effectiveDate, asOf),
        ),
      )
      .orderBy(customerPricingAgreements.effectiveDate)
      .limit(1);
    if (agreement) {
      return {
        amount: num(agreement.negotiatedRate),
        source: "customer_pricing_agreement",
      };
    }
  }

  const [material] = await db
    .select({
      currentUnitCost: materials.currentUnitCost,
      materialCategoryId: materials.materialCategoryId,
    })
    .from(materials)
    .where(eq(materials.id, materialId))
    .limit(1);
  if (
    material?.currentUnitCost !== null &&
    material?.currentUnitCost !== undefined
  ) {
    return {
      amount: num(material.currentUnitCost),
      source: "material_current_unit_cost",
    };
  }

  if (material?.materialCategoryId) {
    const [category] = await db
      .select({ defaultUnitCost: materialCategories.defaultUnitCost })
      .from(materialCategories)
      .where(eq(materialCategories.id, material.materialCategoryId))
      .limit(1);
    if (
      category?.defaultUnitCost !== null &&
      category?.defaultUnitCost !== undefined
    ) {
      return {
        amount: num(category.defaultUnitCost),
        source: "material_category_default",
      };
    }
  }

  return { amount: null, source: "unresolved" };
}

// DOMAIN_MODEL.md §3.8 Labor costing hierarchy (most specific wins).
// Level 1 (manual override) is handled by the caller.
export async function resolveLaborRate(
  laborProcessId: string,
  customerId: string | null,
): Promise<CostResolution> {
  const asOf = today();

  if (customerId) {
    const [agreement] = await db
      .select()
      .from(customerPricingAgreements)
      .where(
        and(
          eq(customerPricingAgreements.customerId, customerId),
          eq(customerPricingAgreements.scopeType, "labor_process"),
          eq(customerPricingAgreements.scopeId, laborProcessId),
          lte(customerPricingAgreements.effectiveDate, asOf),
        ),
      )
      .orderBy(customerPricingAgreements.effectiveDate)
      .limit(1);
    if (agreement) {
      return {
        amount: num(agreement.negotiatedRate),
        source: "customer_pricing_agreement",
      };
    }
  }

  const [process] = await db
    .select({ costCategoryId: laborProcesses.costCategoryId })
    .from(laborProcesses)
    .where(eq(laborProcesses.id, laborProcessId))
    .limit(1);

  const isEffective = and(
    lte(laborRates.effectiveDate, asOf),
    or(isNull(laborRates.expiresDate), gte(laborRates.expiresDate, asOf)),
  );

  const [processRate] = await db
    .select()
    .from(laborRates)
    .where(and(eq(laborRates.laborProcessId, laborProcessId), isEffective))
    .orderBy(laborRates.effectiveDate)
    .limit(1);
  if (processRate) {
    return {
      amount: num(processRate.ratePerHour),
      source: "labor_process_rate",
    };
  }

  if (process?.costCategoryId) {
    const [categoryRate] = await db
      .select()
      .from(laborRates)
      .where(
        and(
          isNull(laborRates.laborProcessId),
          eq(laborRates.costCategoryId, process.costCategoryId),
          isEffective,
        ),
      )
      .orderBy(laborRates.effectiveDate)
      .limit(1);
    if (categoryRate) {
      return {
        amount: num(categoryRate.ratePerHour),
        source: "cost_category_fallback_rate",
      };
    }
  }

  const [globalRate] = await db
    .select()
    .from(laborRates)
    .where(
      and(
        isNull(laborRates.laborProcessId),
        isNull(laborRates.costCategoryId),
        isEffective,
      ),
    )
    .orderBy(laborRates.effectiveDate)
    .limit(1);
  if (globalRate) {
    return {
      amount: num(globalRate.ratePerHour),
      source: "global_default_rate",
    };
  }

  return { amount: null, source: "unresolved" };
}

export interface CostBreakdownLine {
  description: string;
  quantity: number;
  unitCost: number | null;
  source: string;
  lineTotal: number | null;
}

export interface TemplateCostBreakdown {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  overheadCost: number;
  totalDirectCost: number;
  unresolvedLines: CostBreakdownLine[];
  detail: {
    materialLines: CostBreakdownLine[];
    laborLines: CostBreakdownLine[];
    equipmentLines: CostBreakdownLine[];
    overheadLines: CostBreakdownLine[];
  };
}

// DOMAIN_MODEL.md §3.6. All amounts are PER UNIT of the product
// template's "recipe" — Estimate Item quantity is applied later, once,
// at Extended Price = Net Price × Quantity. See the flat_per_unit note
// below for why that matters.
export async function computeProductTemplateCost(
  productTemplateId: string,
  customerId: string | null,
): Promise<TemplateCostBreakdown> {
  const template = await db.query.productTemplates.findFirst({
    where: eq(productTemplates.id, productTemplateId),
    with: {
      bomTemplate: { with: { lines: { with: { material: true, uom: true } } } },
      laborTemplate: { with: { lines: { with: { laborProcess: true } } } },
      equipmentTemplate: { with: { lines: { with: { equipment: true } } } },
      overheadTemplate: { with: { lines: { with: { costCategory: true } } } },
    },
  });

  const materialLines: CostBreakdownLine[] = [];
  let materialCost = 0;
  for (const line of template?.bomTemplate?.lines ?? []) {
    const resolved = await resolveMaterialCost(line.materialId, customerId);
    const scrapMultiplier = 1 + (pct(line.scrapPercent) ?? 0);
    const qty = num(line.quantity);
    const lineTotal =
      resolved.amount === null ? null : qty * resolved.amount * scrapMultiplier;
    materialLines.push({
      description: line.material.name,
      quantity: qty,
      unitCost: resolved.amount,
      source: resolved.source,
      lineTotal,
    });
    materialCost += lineTotal ?? 0;
  }

  const laborLines: CostBreakdownLine[] = [];
  let laborCost = 0;
  for (const line of template?.laborTemplate?.lines ?? []) {
    const resolved = await resolveLaborRate(line.laborProcessId, customerId);
    const hours = num(line.standardHours);
    const lineTotal = resolved.amount === null ? null : hours * resolved.amount;
    laborLines.push({
      description: line.laborProcess.name,
      quantity: hours,
      unitCost: resolved.amount,
      source: resolved.source,
      lineTotal,
    });
    laborCost += lineTotal ?? 0;
  }

  const equipmentLines: CostBreakdownLine[] = [];
  let equipmentCost = 0;
  for (const line of template?.equipmentTemplate?.lines ?? []) {
    const rate = num(line.equipment.ratePerHour);
    const hours = num(line.standardHours);
    const lineTotal = hours * rate;
    equipmentLines.push({
      description: line.equipment.name,
      quantity: hours,
      unitCost: rate,
      source: "equipment_rate_per_hour",
      lineTotal,
    });
    equipmentCost += lineTotal;
  }

  const overheadLines: CostBreakdownLine[] = [];
  let overheadCost = 0;
  for (const line of template?.overheadTemplate?.lines ?? []) {
    const rate = pct(line.rate) ?? 0;
    let lineTotal: number;
    if (line.allocationMethod === "percent_of_labor") {
      lineTotal = rate * laborCost;
    } else if (line.allocationMethod === "percent_of_direct_cost") {
      lineTotal = rate * (materialCost + laborCost + equipmentCost);
    } else {
      // flat_per_unit: the rate IS the per-unit overhead cost already
      // (that's what "per_unit" in the method name means) — NOT
      // multiplied by Estimate Item quantity here, since that
      // multiplication happens once, later, at Extended Price. Doing
      // it here too would double-count. See DECISIONS.md.
      lineTotal = num(line.rate);
    }
    overheadLines.push({
      description: `${line.costCategory.name} (${line.allocationMethod})`,
      quantity: 1,
      unitCost: lineTotal,
      source: line.allocationMethod,
      lineTotal,
    });
    overheadCost += lineTotal;
  }

  const totalDirectCost =
    materialCost + laborCost + equipmentCost + overheadCost;
  const unresolvedLines = [...materialLines, ...laborLines].filter(
    (line) => line.unitCost === null,
  );

  return {
    materialCost,
    laborCost,
    equipmentCost,
    overheadCost,
    totalDirectCost,
    unresolvedLines,
    detail: { materialLines, laborLines, equipmentLines, overheadLines },
  };
}

export interface MarkupResolution {
  markupPercent: number | null;
  targetMarginPercent: number | null;
  ruleId: string | null;
}

// DOMAIN_MODEL.md §1.2/§3.6: "most-specific wins" — Customer is most
// specific (a negotiated deal beats a product default), then Product
// Template, then Product Category as the coarsest fallback. This
// ordering isn't spelled out verbatim in the domain model; confirmed
// correct by the user — see DECISIONS.md.
export async function resolveMarkup(params: {
  customerId: string | null;
  productTemplateId: string | null;
  productCategoryId: string | null;
}): Promise<MarkupResolution> {
  const asOf = today();
  const scopes: Array<{
    scopeType: "customer" | "product_template" | "product_category";
    scopeId: string | null;
  }> = [
    { scopeType: "customer", scopeId: params.customerId },
    { scopeType: "product_template", scopeId: params.productTemplateId },
    { scopeType: "product_category", scopeId: params.productCategoryId },
  ];

  for (const scope of scopes) {
    if (!scope.scopeId) continue;
    const [rule] = await db
      .select()
      .from(markupRules)
      .where(
        and(
          eq(markupRules.scopeType, scope.scopeType),
          eq(markupRules.scopeId, scope.scopeId),
          lte(markupRules.effectiveDate, asOf),
        ),
      )
      .orderBy(markupRules.effectiveDate)
      .limit(1);
    if (rule) {
      return {
        markupPercent: pct(rule.markupPercent),
        targetMarginPercent: pct(rule.targetMarginPercent),
        ruleId: rule.id,
      };
    }
  }

  return { markupPercent: null, targetMarginPercent: null, ruleId: null };
}

export interface DiscountResolution {
  discountPercent: number | null;
  discountAmount: number | null;
  ruleId: string | null;
}

export async function resolveDiscount(
  customerId: string | null,
  quantity: number,
): Promise<DiscountResolution> {
  if (!customerId)
    return { discountPercent: null, discountAmount: null, ruleId: null };

  const rules = await db
    .select()
    .from(discountRules)
    .where(
      and(
        eq(discountRules.scopeType, "customer"),
        eq(discountRules.scopeId, customerId),
      ),
    );

  const eligible = rules.filter(
    (rule) => rule.minQuantity === null || num(rule.minQuantity) <= quantity,
  );
  if (eligible.length === 0)
    return { discountPercent: null, discountAmount: null, ruleId: null };

  eligible.sort((a, b) => num(b.minQuantity) - num(a.minQuantity));
  const best = eligible[0];
  return {
    discountPercent: pct(best.discountPercent),
    discountAmount:
      best.discountAmount === null ? null : num(best.discountAmount),
    ruleId: best.id,
  };
}

export async function resolveTaxRatePercent(
  productCategoryId: string | null,
  jurisdiction: string | null,
): Promise<number | null> {
  if (!jurisdiction) return null;

  const rules = await db
    .select()
    .from(taxRules)
    .where(eq(taxRules.jurisdiction, jurisdiction));

  const categorySpecific = productCategoryId
    ? rules.find((rule) => rule.productCategoryId === productCategoryId)
    : undefined;
  const allCategories = rules.find((rule) => rule.productCategoryId === null);
  const match = categorySpecific ?? allCategories;
  return match ? pct(match.ratePercent) : null;
}

export interface EstimateItemPricing {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  overheadCost: number;
  totalDirectCost: number;
  costSnapshotDetail: TemplateCostBreakdown["detail"] | null;
  unresolvedLines: CostBreakdownLine[];
  appliedMarkupRuleId: string | null;
  appliedMarkupPercent: number | null;
  appliedTargetMarginPercent: number | null;
  appliedDiscountRuleId: string | null;
  appliedDiscountPercent: number | null;
  appliedDiscountAmount: number | null;
  listPrice: number;
  netPrice: number;
  extendedPrice: number;
  marginPercent: number | null;
  markupPercentActual: number;
}

export async function computeEstimateItemPricing(params: {
  productTemplateId: string | null;
  quantity: number;
  customerId: string | null;
  productCategoryId: string | null;
  jurisdiction: string | null;
  manualCostOverride: number | null;
}): Promise<EstimateItemPricing> {
  let costs: TemplateCostBreakdown;
  if (params.manualCostOverride !== null) {
    costs = {
      materialCost: 0,
      laborCost: 0,
      equipmentCost: 0,
      overheadCost: 0,
      totalDirectCost: params.manualCostOverride,
      unresolvedLines: [],
      detail: {
        materialLines: [],
        laborLines: [],
        equipmentLines: [],
        overheadLines: [],
      },
    };
  } else if (params.productTemplateId) {
    costs = await computeProductTemplateCost(
      params.productTemplateId,
      params.customerId,
    );
  } else {
    costs = {
      materialCost: 0,
      laborCost: 0,
      equipmentCost: 0,
      overheadCost: 0,
      totalDirectCost: 0,
      unresolvedLines: [],
      detail: {
        materialLines: [],
        laborLines: [],
        equipmentLines: [],
        overheadLines: [],
      },
    };
  }

  const markup = await resolveMarkup({
    customerId: params.customerId,
    productTemplateId: params.productTemplateId,
    productCategoryId: params.productCategoryId,
  });

  let listPrice: number;
  if (markup.markupPercent !== null) {
    listPrice = costs.totalDirectCost * (1 + markup.markupPercent);
  } else if (markup.targetMarginPercent !== null) {
    // Margin % = (Net Price − Cost) / Net Price  =>  Price = Cost / (1 − Margin%)
    listPrice = costs.totalDirectCost / (1 - markup.targetMarginPercent);
  } else {
    listPrice = costs.totalDirectCost;
  }

  const discount = await resolveDiscount(params.customerId, params.quantity);
  let netPrice = listPrice;
  if (discount.discountPercent !== null) {
    netPrice = listPrice * (1 - discount.discountPercent);
  } else if (discount.discountAmount !== null) {
    netPrice = listPrice - discount.discountAmount;
  }

  const extendedPrice = netPrice * params.quantity;
  const marginPercent =
    netPrice !== 0 ? (netPrice - costs.totalDirectCost) / netPrice : null;
  const markupPercentActual =
    costs.totalDirectCost !== 0
      ? (netPrice - costs.totalDirectCost) / costs.totalDirectCost
      : 0;

  return {
    materialCost: costs.materialCost,
    laborCost: costs.laborCost,
    equipmentCost: costs.equipmentCost,
    overheadCost: costs.overheadCost,
    totalDirectCost: costs.totalDirectCost,
    costSnapshotDetail:
      params.manualCostOverride !== null ? null : costs.detail,
    unresolvedLines: costs.unresolvedLines,
    appliedMarkupRuleId: markup.ruleId,
    appliedMarkupPercent: markup.markupPercent,
    appliedTargetMarginPercent: markup.targetMarginPercent,
    appliedDiscountRuleId: discount.ruleId,
    appliedDiscountPercent: discount.discountPercent,
    appliedDiscountAmount: discount.discountAmount,
    listPrice,
    netPrice,
    extendedPrice,
    marginPercent,
    markupPercentActual,
  };
}
