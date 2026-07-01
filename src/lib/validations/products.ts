import { z } from "zod";

const optionalUuid = z.string().uuid().optional().nullable();

export const productTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  productCategoryId: z.string().uuid("Product category is required"),
  bomTemplateId: optionalUuid,
  laborTemplateId: optionalUuid,
  equipmentTemplateId: optionalUuid,
  overheadTemplateId: optionalUuid,
});
export type ProductTemplateValues = z.infer<typeof productTemplateSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  productCategoryId: z.string().uuid("Product category is required"),
  productTemplateId: optionalUuid,
});
export type ProductValues = z.infer<typeof productSchema>;
