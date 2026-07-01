import { z } from "zod";

const decimalString = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message,
    });

export const overheadAllocationMethodValues = [
  "percent_of_labor",
  "percent_of_direct_cost",
  "flat_per_unit",
] as const;

export const bomTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  revision: z.number().int().min(1),
  isActive: z.boolean(),
});
export type BomTemplateValues = z.infer<typeof bomTemplateSchema>;

export const bomTemplateLineSchema = z.object({
  materialId: z.string().uuid("Material is required"),
  quantity: decimalString("Must be a non-negative number"),
  uomId: z.string().uuid("Unit of measure is required"),
  scrapPercent: decimalString("Must be a non-negative number"),
});
export type BomTemplateLineValues = z.infer<typeof bomTemplateLineSchema>;

export const laborTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean(),
});
export type LaborTemplateValues = z.infer<typeof laborTemplateSchema>;

export const laborTemplateLineSchema = z.object({
  laborProcessId: z.string().uuid("Labor process is required"),
  standardHours: decimalString("Must be a non-negative number"),
});
export type LaborTemplateLineValues = z.infer<typeof laborTemplateLineSchema>;

export const equipmentTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean(),
});
export type EquipmentTemplateValues = z.infer<typeof equipmentTemplateSchema>;

export const equipmentTemplateLineSchema = z.object({
  equipmentId: z.string().uuid("Equipment is required"),
  standardHours: decimalString("Must be a non-negative number"),
});
export type EquipmentTemplateLineValues = z.infer<
  typeof equipmentTemplateLineSchema
>;

export const overheadTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean(),
});
export type OverheadTemplateValues = z.infer<typeof overheadTemplateSchema>;

export const overheadTemplateLineSchema = z.object({
  costCategoryId: z.string().uuid("Cost category is required"),
  allocationMethod: z.enum(overheadAllocationMethodValues),
  rate: decimalString("Must be a non-negative number"),
});
export type OverheadTemplateLineValues = z.infer<
  typeof overheadTemplateLineSchema
>;
