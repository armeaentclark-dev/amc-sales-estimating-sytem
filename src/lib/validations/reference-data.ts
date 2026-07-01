import { z } from "zod";

export const costTypeValues = [
  "material",
  "labor",
  "equipment",
  "overhead",
] as const;

export const uomSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
});

export type UomValues = z.infer<typeof uomSchema>;

export const costCategorySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  costType: z.enum(costTypeValues),
});

export type CostCategoryValues = z.infer<typeof costCategorySchema>;

export const materialCategorySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  defaultUnitCost: z
    .string()
    .refine(
      (value) =>
        value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Must be a non-negative number",
    ),
});

export type MaterialCategoryValues = z.infer<typeof materialCategorySchema>;

export const productCategorySchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  parentCategoryId: z.string().uuid().optional().nullable(),
});

export type ProductCategoryValues = z.infer<typeof productCategorySchema>;
