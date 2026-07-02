import { z } from "zod";

export const estimateSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  salespersonId: z.string().uuid("Salesperson is required"),
  title: z.string().min(1, "Title is required"),
  currency: z.string().min(1, "Currency is required"),
  validUntil: z.string().optional().nullable(),
});
export type EstimateValues = z.infer<typeof estimateSchema>;

const optionalUuid = z.string().uuid().optional().nullable();

export const estimateItemSchema = z
  .object({
    productId: optionalUuid,
    productTemplateId: optionalUuid,
    description: z.string().min(1, "Description is required"),
    quantity: z
      .string()
      .min(1, "Quantity is required")
      .refine(
        (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
        "Must be a positive number",
      ),
    uomId: z.string().uuid("Unit of measure is required"),
    manualCostOverride: z
      .string()
      .optional()
      .refine((v) => !v || !Number.isNaN(Number(v)), "Must be a number"),
  })
  .refine((v) => v.productId || v.productTemplateId, {
    message: "Select a product or a product template",
    path: ["productTemplateId"],
  });
export type EstimateItemValues = z.infer<typeof estimateItemSchema>;

export const approvalDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().optional(),
  thresholdReason: z.string().optional(),
});
export type ApprovalDecisionValues = z.infer<typeof approvalDecisionSchema>;

export const noteSchema = z.object({
  body: z.string().min(1, "Note can't be empty"),
});
export type NoteValues = z.infer<typeof noteSchema>;

export const attachmentSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  fileUrl: z.string().min(1, "File URL is required"),
});
export type AttachmentValues = z.infer<typeof attachmentSchema>;
