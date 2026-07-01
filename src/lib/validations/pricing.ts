import { z } from "zod";

const decimalString = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)), { message });

const optionalDecimalString = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(Number(value)), {
    message: "Must be a number",
  });

export const markupScopeTypeValues = [
  "product_category",
  "product_template",
  "customer",
] as const;
export const markupRateTypeValues = [
  "markup_percent",
  "target_margin_percent",
] as const;

export const markupRuleSchema = z.object({
  scopeType: z.enum(markupScopeTypeValues),
  scopeId: z.string().uuid("Scope is required"),
  rateType: z.enum(markupRateTypeValues),
  rateValue: decimalString("Must be a number"),
  effectiveDate: z.string().min(1, "Effective date is required"),
});
export type MarkupRuleValues = z.infer<typeof markupRuleSchema>;

export const discountRateTypeValues = [
  "discount_percent",
  "discount_amount",
] as const;

export const discountRuleSchema = z.object({
  scopeType: z.literal("customer"),
  scopeId: z.string().uuid("Customer is required"),
  rateType: z.enum(discountRateTypeValues),
  rateValue: decimalString("Must be a number"),
  minQuantity: optionalDecimalString,
});
export type DiscountRuleValues = z.infer<typeof discountRuleSchema>;

export const taxRuleSchema = z.object({
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  ratePercent: decimalString("Must be a number"),
  productCategoryId: z.string().uuid().optional().nullable(),
});
export type TaxRuleValues = z.infer<typeof taxRuleSchema>;

export const pricingAgreementScopeTypeValues = [
  "material",
  "labor_process",
] as const;

export const customerPricingAgreementSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  scopeType: z.enum(pricingAgreementScopeTypeValues),
  scopeId: z.string().uuid("Material or labor process is required"),
  negotiatedRate: decimalString("Must be a number"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  expiresDate: z.string().optional().nullable(),
});
export type CustomerPricingAgreementValues = z.infer<
  typeof customerPricingAgreementSchema
>;

export const approvalThresholdSchema = z.object({
  name: z.string().min(1, "Name is required"),
  marginFloorPercent: optionalDecimalString,
  valueCeiling: optionalDecimalString,
  productCategoryId: z.string().uuid().optional().nullable(),
});
export type ApprovalThresholdValues = z.infer<typeof approvalThresholdSchema>;
