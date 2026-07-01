import { z } from "zod";

// Kept in sync by hand with customerStatusEnum/addressTypeEnum in
// src/lib/db/schema/customers.ts — mirrors organization-settings.ts's
// pattern of not importing the server-only schema module into
// client-shared validation code.
export const customerStatusValues = ["prospect", "active", "inactive"] as const;
export const addressTypeValues = ["billing", "shipping"] as const;

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  status: z.enum(customerStatusValues),
  paymentTerms: z.string().optional(),
});

export type CustomerValues = z.infer<typeof customerSchema>;

export const contactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  title: z.string().optional(),
  email: z.union([z.email("Enter a valid email address"), z.literal("")]),
  phone: z.string().optional(),
  isPrimary: z.boolean(),
});

export type ContactValues = z.infer<typeof contactSchema>;

export const addressSchema = z.object({
  type: z.enum(addressTypeValues),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export type AddressValues = z.infer<typeof addressSchema>;
