import { z } from "zod";

export const organizationSettingsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logoUrl: z.string().optional().nullable(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.email("Enter a valid email address"), z.literal("")]),
  website: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
});

export type OrganizationSettingsValues = z.infer<
  typeof organizationSettingsSchema
>;
