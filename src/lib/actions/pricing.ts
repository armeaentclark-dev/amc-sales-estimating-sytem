"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import {
  approvalThresholds,
  customerPricingAgreements,
  discountRules,
  markupRules,
  taxRules,
} from "@/lib/db/schema";
import {
  approvalThresholdSchema,
  customerPricingAgreementSchema,
  discountRuleSchema,
  markupRuleSchema,
  taxRuleSchema,
  type ApprovalThresholdValues,
  type CustomerPricingAgreementValues,
  type DiscountRuleValues,
  type MarkupRuleValues,
  type TaxRuleValues,
} from "@/lib/validations/pricing";

const PRICING_PATH = "/pricing";

// Markup Rule

export async function getMarkupRules() {
  return db.query.markupRules.findMany({
    orderBy: (markupRules, { desc }) => [desc(markupRules.effectiveDate)],
  });
}

export async function createMarkupRuleAction(values: MarkupRuleValues) {
  const parsed = markupRuleSchema.parse(values);
  await db.insert(markupRules).values({
    scopeType: parsed.scopeType,
    scopeId: parsed.scopeId,
    markupPercent:
      parsed.rateType === "markup_percent" ? parsed.rateValue : null,
    targetMarginPercent:
      parsed.rateType === "target_margin_percent" ? parsed.rateValue : null,
    effectiveDate: parsed.effectiveDate,
  });
  revalidatePath(PRICING_PATH);
}

export async function deleteMarkupRuleAction(id: string) {
  await db.delete(markupRules).where(eq(markupRules.id, id));
  revalidatePath(PRICING_PATH);
}

// Discount Rule

export async function getDiscountRules() {
  return db.query.discountRules.findMany({
    orderBy: (discountRules, { desc }) => [desc(discountRules.createdAt)],
  });
}

export async function createDiscountRuleAction(values: DiscountRuleValues) {
  const parsed = discountRuleSchema.parse(values);
  await db.insert(discountRules).values({
    scopeType: parsed.scopeType,
    scopeId: parsed.scopeId,
    discountPercent:
      parsed.rateType === "discount_percent" ? parsed.rateValue : null,
    discountAmount:
      parsed.rateType === "discount_amount" ? parsed.rateValue : null,
    minQuantity: parsed.minQuantity || null,
  });
  revalidatePath(PRICING_PATH);
}

export async function deleteDiscountRuleAction(id: string) {
  await db.delete(discountRules).where(eq(discountRules.id, id));
  revalidatePath(PRICING_PATH);
}

// Tax Rule

export async function getTaxRules() {
  return db.query.taxRules.findMany({
    orderBy: (taxRules, { asc }) => [asc(taxRules.jurisdiction)],
    with: { productCategory: true },
  });
}

export async function createTaxRuleAction(values: TaxRuleValues) {
  const parsed = taxRuleSchema.parse(values);
  await db.insert(taxRules).values({
    jurisdiction: parsed.jurisdiction,
    ratePercent: parsed.ratePercent,
    productCategoryId: parsed.productCategoryId || null,
  });
  revalidatePath(PRICING_PATH);
}

export async function deleteTaxRuleAction(id: string) {
  await db.delete(taxRules).where(eq(taxRules.id, id));
  revalidatePath(PRICING_PATH);
}

// Customer Pricing Agreement

export async function getCustomerPricingAgreements() {
  return db.query.customerPricingAgreements.findMany({
    orderBy: (agreements, { desc }) => [desc(agreements.effectiveDate)],
    with: { customer: true },
  });
}

export async function createCustomerPricingAgreementAction(
  values: CustomerPricingAgreementValues,
) {
  const parsed = customerPricingAgreementSchema.parse(values);
  await db.insert(customerPricingAgreements).values({
    customerId: parsed.customerId,
    scopeType: parsed.scopeType,
    scopeId: parsed.scopeId,
    negotiatedRate: parsed.negotiatedRate,
    effectiveDate: parsed.effectiveDate,
    expiresDate: parsed.expiresDate || null,
  });
  revalidatePath(PRICING_PATH);
}

export async function deleteCustomerPricingAgreementAction(id: string) {
  await db
    .delete(customerPricingAgreements)
    .where(eq(customerPricingAgreements.id, id));
  revalidatePath(PRICING_PATH);
}

// Approval Threshold

export async function getApprovalThresholds() {
  return db.query.approvalThresholds.findMany({
    orderBy: (thresholds, { asc }) => [asc(thresholds.name)],
    with: { productCategory: true },
  });
}

export async function createApprovalThresholdAction(
  values: ApprovalThresholdValues,
) {
  const parsed = approvalThresholdSchema.parse(values);
  await db.insert(approvalThresholds).values({
    name: parsed.name,
    marginFloorPercent: parsed.marginFloorPercent || null,
    valueCeiling: parsed.valueCeiling || null,
    productCategoryId: parsed.productCategoryId || null,
  });
  revalidatePath(PRICING_PATH);
}

export async function updateApprovalThresholdAction(
  id: string,
  values: ApprovalThresholdValues,
) {
  const parsed = approvalThresholdSchema.parse(values);
  await db
    .update(approvalThresholds)
    .set({
      name: parsed.name,
      marginFloorPercent: parsed.marginFloorPercent || null,
      valueCeiling: parsed.valueCeiling || null,
      productCategoryId: parsed.productCategoryId || null,
      updatedAt: new Date(),
    })
    .where(eq(approvalThresholds.id, id));
  revalidatePath(PRICING_PATH);
}

export async function deleteApprovalThresholdAction(id: string) {
  await db.delete(approvalThresholds).where(eq(approvalThresholds.id, id));
  revalidatePath(PRICING_PATH);
}
