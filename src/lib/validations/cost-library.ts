import { z } from "zod";

const decimalString = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message,
    });

export const materialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  materialCategoryId: z.string().uuid("Material category is required"),
  uomId: z.string().uuid("Unit of measure is required"),
  currentUnitCost: decimalString("Must be a non-negative number"),
  costCategoryId: z.string().uuid("Cost category is required"),
});

export type MaterialValues = z.infer<typeof materialSchema>;

export const laborProcessSchema = z.object({
  name: z.string().min(1, "Name is required"),
  costCategoryId: z.string().uuid("Cost category is required"),
});

export type LaborProcessValues = z.infer<typeof laborProcessSchema>;

export const laborRateSchema = z.object({
  laborProcessId: z.string().uuid().optional().nullable(),
  costCategoryId: z.string().uuid().optional().nullable(),
  ratePerHour: decimalString("Must be a non-negative number"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  expiresDate: z.string().optional().nullable(),
});

export type LaborRateValues = z.infer<typeof laborRateSchema>;

export const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  costCategoryId: z.string().uuid("Cost category is required"),
  ratePerHour: decimalString("Must be a non-negative number"),
});

export type EquipmentValues = z.infer<typeof equipmentSchema>;
