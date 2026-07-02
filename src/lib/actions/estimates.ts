"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  computeEstimateItemPricing,
  resolveTaxRatePercent,
} from "@/lib/estimating/pricing-engine";
import { db } from "@/lib/db/client";
import {
  addresses,
  approvals,
  attachments,
  estimateItems,
  estimateRevisions,
  estimateStatuses,
  estimates,
  notes,
  productTemplates,
  products,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  approvalDecisionSchema,
  attachmentSchema,
  estimateItemSchema,
  estimateSchema,
  noteSchema,
  type AttachmentValues,
  type EstimateItemValues,
  type EstimateValues,
  type NoteValues,
} from "@/lib/validations/estimates";

const ESTIMATES_PATH = "/estimates";

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function getStatusByCode(code: string) {
  const [status] = await db
    .select()
    .from(estimateStatuses)
    .where(eq(estimateStatuses.code, code));
  if (!status) throw new Error(`Unknown estimate status code: ${code}`);
  return status;
}

// Estimate

export async function getEstimates() {
  return db.query.estimates.findMany({
    orderBy: (estimates, { desc }) => [desc(estimates.createdAt)],
    with: {
      customer: true,
      salesperson: true,
      revisions: {
        with: { status: true },
        orderBy: (r, { desc }) => [desc(r.revisionNumber)],
      },
    },
  });
}

export async function getEstimate(id: string) {
  const estimate = await db.query.estimates.findFirst({
    where: eq(estimates.id, id),
    with: {
      customer: true,
      salesperson: true,
      revisions: {
        orderBy: (r, { desc }) => [desc(r.revisionNumber)],
        with: {
          status: true,
          createdByUser: true,
          approvals: {
            with: { approver: true },
            orderBy: (a, { desc }) => [desc(a.decidedAt)],
          },
          items: {
            orderBy: (i, { asc }) => [asc(i.lineNumber)],
            with: {
              product: { with: { productCategory: true } },
              productTemplate: { with: { productCategory: true } },
              uom: true,
            },
          },
        },
      },
    },
  });
  if (!estimate) return null;

  const [billingAddress] = await db
    .select({ state: addresses.state })
    .from(addresses)
    .where(
      and(
        eq(addresses.customerId, estimate.customerId),
        eq(addresses.type, "billing"),
      ),
    )
    .limit(1);
  const jurisdiction = billingAddress?.state ?? null;

  const revisionsWithTotals = await Promise.all(
    estimate.revisions.map(async (revision) => {
      let subtotal = 0;
      let tax = 0;
      let totalCost = 0;
      for (const item of revision.items) {
        const extended = Number(item.extendedPrice ?? 0);
        subtotal += extended;
        totalCost += Number(item.totalDirectCost ?? 0) * Number(item.quantity);
        const categoryId =
          item.product?.productCategoryId ??
          item.productTemplate?.productCategoryId ??
          null;
        const rate = await resolveTaxRatePercent(categoryId, jurisdiction);
        tax += rate ? extended * rate : 0;
      }
      const total = subtotal + tax;
      const marginPercent =
        subtotal !== 0 ? (subtotal - totalCost) / subtotal : null;
      return {
        ...revision,
        totals: { subtotal, tax, total, totalCost, marginPercent },
      };
    }),
  );

  const revisionNotesAndAttachments = await Promise.all(
    revisionsWithTotals.map(async (revision) => {
      const revisionNotes = await db.query.notes.findMany({
        where: and(
          eq(notes.attachedToType, "estimate_revision"),
          eq(notes.attachedToId, revision.id),
        ),
        with: { author: true },
        orderBy: (n, { desc }) => [desc(n.createdAt)],
      });
      return { ...revision, notesOnRevision: revisionNotes };
    }),
  );

  const estimateNotes = await db.query.notes.findMany({
    where: and(
      eq(notes.attachedToType, "estimate"),
      eq(notes.attachedToId, estimate.id),
    ),
    with: { author: true },
    orderBy: (n, { desc }) => [desc(n.createdAt)],
  });
  const estimateAttachments = await db.query.attachments.findMany({
    where: and(
      eq(attachments.attachedToType, "estimate"),
      eq(attachments.attachedToId, estimate.id),
    ),
    with: { uploadedByUser: true },
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });

  return {
    ...estimate,
    revisions: revisionNotesAndAttachments,
    jurisdiction,
    notes: estimateNotes,
    attachments: estimateAttachments,
  };
}

export async function createEstimateAction(values: EstimateValues) {
  const parsed = estimateSchema.parse(values);
  const userId = await getCurrentUserId();
  const draftStatus = await getStatusByCode("draft");

  const [estimate] = await db
    .insert(estimates)
    .values({
      customerId: parsed.customerId,
      salespersonId: parsed.salespersonId,
      title: parsed.title,
      currency: parsed.currency,
      validUntil: parsed.validUntil || null,
    })
    .returning();

  await db.insert(estimateRevisions).values({
    estimateId: estimate.id,
    revisionNumber: 1,
    statusId: draftStatus.id,
    isCurrent: true,
    createdBy: userId,
  });

  revalidatePath(ESTIMATES_PATH);
  return estimate;
}

export async function updateEstimateAction(id: string, values: EstimateValues) {
  const parsed = estimateSchema.parse(values);
  await db
    .update(estimates)
    .set({
      customerId: parsed.customerId,
      salespersonId: parsed.salespersonId,
      title: parsed.title,
      currency: parsed.currency,
      validUntil: parsed.validUntil || null,
      updatedAt: new Date(),
    })
    .where(eq(estimates.id, id));
  revalidatePath(ESTIMATES_PATH);
  revalidatePath(`${ESTIMATES_PATH}/${id}`);
}

// Estimate Item

async function resolveItemCategoryId(values: EstimateItemValues) {
  if (values.productId) {
    const [product] = await db
      .select({ productCategoryId: products.productCategoryId })
      .from(products)
      .where(eq(products.id, values.productId));
    return product?.productCategoryId ?? null;
  }
  if (values.productTemplateId) {
    const [template] = await db
      .select({ productCategoryId: productTemplates.productCategoryId })
      .from(productTemplates)
      .where(eq(productTemplates.id, values.productTemplateId));
    return template?.productCategoryId ?? null;
  }
  return null;
}

async function priceAndBuildItemValues(
  estimateRevisionId: string,
  values: EstimateItemValues,
) {
  const [revision] = await db
    .select({ estimateId: estimateRevisions.estimateId })
    .from(estimateRevisions)
    .where(eq(estimateRevisions.id, estimateRevisionId));
  const [estimate] = await db
    .select({ customerId: estimates.customerId })
    .from(estimates)
    .where(eq(estimates.id, revision.estimateId));

  const productCategoryId = await resolveItemCategoryId(values);
  const quantity = Number(values.quantity);
  const manualCostOverride =
    values.manualCostOverride && values.manualCostOverride !== ""
      ? Number(values.manualCostOverride)
      : null;

  const pricing = await computeEstimateItemPricing({
    productTemplateId: values.productTemplateId || null,
    quantity,
    customerId: estimate.customerId,
    productCategoryId,
    jurisdiction: null,
    manualCostOverride,
  });

  return {
    productId: values.productId || null,
    productTemplateId: values.productTemplateId || null,
    description: values.description,
    quantity: String(quantity),
    uomId: values.uomId,
    materialCost: String(pricing.materialCost),
    laborCost: String(pricing.laborCost),
    equipmentCost: String(pricing.equipmentCost),
    overheadCost: String(pricing.overheadCost),
    totalDirectCost: String(pricing.totalDirectCost),
    costSnapshotDetail: pricing.costSnapshotDetail,
    manualCostOverride:
      manualCostOverride === null ? null : String(manualCostOverride),
    appliedMarkupRuleId: pricing.appliedMarkupRuleId,
    appliedMarkupPercent:
      pricing.appliedMarkupPercent === null
        ? null
        : String(pricing.appliedMarkupPercent * 100),
    appliedTargetMarginPercent:
      pricing.appliedTargetMarginPercent === null
        ? null
        : String(pricing.appliedTargetMarginPercent * 100),
    appliedDiscountRuleId: pricing.appliedDiscountRuleId,
    appliedDiscountPercent:
      pricing.appliedDiscountPercent === null
        ? null
        : String(pricing.appliedDiscountPercent * 100),
    appliedDiscountAmount:
      pricing.appliedDiscountAmount === null
        ? null
        : String(pricing.appliedDiscountAmount),
    listPrice: String(pricing.listPrice),
    netPrice: String(pricing.netPrice),
    extendedPrice: String(pricing.extendedPrice),
  };
}

export async function createEstimateItemAction(
  estimateRevisionId: string,
  values: EstimateItemValues,
) {
  const parsed = estimateItemSchema.parse(values);
  const built = await priceAndBuildItemValues(estimateRevisionId, parsed);

  const existing = await db
    .select({ lineNumber: estimateItems.lineNumber })
    .from(estimateItems)
    .where(eq(estimateItems.estimateRevisionId, estimateRevisionId))
    .orderBy(desc(estimateItems.lineNumber))
    .limit(1);
  const nextLineNumber = (existing[0]?.lineNumber ?? 0) + 1;

  await db.insert(estimateItems).values({
    estimateRevisionId,
    lineNumber: nextLineNumber,
    ...built,
  });

  const [revision] = await db
    .select({ estimateId: estimateRevisions.estimateId })
    .from(estimateRevisions)
    .where(eq(estimateRevisions.id, estimateRevisionId));
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function updateEstimateItemAction(
  id: string,
  values: EstimateItemValues,
) {
  const parsed = estimateItemSchema.parse(values);
  const [item] = await db
    .select({ estimateRevisionId: estimateItems.estimateRevisionId })
    .from(estimateItems)
    .where(eq(estimateItems.id, id));
  const built = await priceAndBuildItemValues(item.estimateRevisionId, parsed);

  await db
    .update(estimateItems)
    .set({ ...built, updatedAt: new Date() })
    .where(eq(estimateItems.id, id));

  const [revision] = await db
    .select({ estimateId: estimateRevisions.estimateId })
    .from(estimateRevisions)
    .where(eq(estimateRevisions.id, item.estimateRevisionId));
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function deleteEstimateItemAction(id: string) {
  const [item] = await db
    .select({ estimateRevisionId: estimateItems.estimateRevisionId })
    .from(estimateItems)
    .where(eq(estimateItems.id, id));
  await db.delete(estimateItems).where(eq(estimateItems.id, id));

  const [revision] = await db
    .select({ estimateId: estimateRevisions.estimateId })
    .from(estimateRevisions)
    .where(eq(estimateRevisions.id, item.estimateRevisionId));
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

// Status transitions (DOMAIN_MODEL.md §3.1/§3.4). Every transition
// checks the current status's allowed_next_states before applying —
// the seeded estimate_statuses rows are the single source of truth
// for what's legal, not scattered if/else checks per action.
async function transitionRevision(revisionId: string, toCode: string) {
  const revision = await db.query.estimateRevisions.findFirst({
    where: eq(estimateRevisions.id, revisionId),
    with: { status: true },
  });
  if (!revision) throw new Error("Revision not found");
  if (!revision.status.allowedNextStates.includes(toCode)) {
    throw new Error(
      `Cannot move from "${revision.status.code}" to "${toCode}"`,
    );
  }
  const target = await getStatusByCode(toCode);
  await db
    .update(estimateRevisions)
    .set({ statusId: target.id, updatedAt: new Date() })
    .where(eq(estimateRevisions.id, revisionId));
  return revision;
}

export async function submitForReviewAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "in_review");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function requestChangesInReviewAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "draft");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

// Records an Approval decision. A single "approved" decision is
// enough to move the revision to Approved for this MVP — the domain
// model's "multi-level" note (§3.3) describes an example (sales
// manager, then finance) rather than a concrete rule for how many
// levels/approvers are required, so a fixed N-approvals-required
// engine is out of scope here. See DECISIONS.md.
export async function recordApprovalAction(
  revisionId: string,
  values: {
    decision: "approved" | "rejected";
    comment?: string;
    thresholdReason?: string;
  },
) {
  const parsed = approvalDecisionSchema.parse(values);
  const userId = await getCurrentUserId();

  await db.insert(approvals).values({
    estimateRevisionId: revisionId,
    approverId: userId,
    decision: parsed.decision,
    comment: parsed.comment || null,
    thresholdReason: parsed.thresholdReason || null,
  });

  const revision = await transitionRevision(
    revisionId,
    parsed.decision === "approved" ? "approved" : "rejected",
  );
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function markSentAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "sent");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function markWonAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "won");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function markLostAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "lost");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function markExpiredAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "expired");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function markVoidedAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "voided");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

export async function markConvertedAction(revisionId: string) {
  const revision = await transitionRevision(revisionId, "converted");
  revalidatePath(`${ESTIMATES_PATH}/${revision.estimateId}`);
}

// Customer requests changes on a Sent revision: creates a new Draft
// revision copying items forward, supersedes the current one
// (DOMAIN_MODEL.md §3.2) — unlike requestChangesInReviewAction, which
// just reverts the same revision's status.
export async function requestChangesOnSentAction(revisionId: string) {
  const userId = await getCurrentUserId();
  const source = await db.query.estimateRevisions.findFirst({
    where: eq(estimateRevisions.id, revisionId),
    with: { status: true, items: true },
  });
  if (!source) throw new Error("Revision not found");
  if (!source.status.allowedNextStates.includes("draft")) {
    throw new Error(`Cannot request changes from "${source.status.code}"`);
  }

  const draftStatus = await getStatusByCode("draft");
  const [newRevision] = await db
    .insert(estimateRevisions)
    .values({
      estimateId: source.estimateId,
      revisionNumber: source.revisionNumber + 1,
      statusId: draftStatus.id,
      isCurrent: true,
      createdBy: userId,
    })
    .returning();

  if (source.items.length > 0) {
    await db.insert(estimateItems).values(
      source.items.map((item) => ({
        estimateRevisionId: newRevision.id,
        lineNumber: item.lineNumber,
        productId: item.productId,
        productTemplateId: item.productTemplateId,
        description: item.description,
        quantity: item.quantity,
        uomId: item.uomId,
        materialCost: item.materialCost,
        laborCost: item.laborCost,
        equipmentCost: item.equipmentCost,
        overheadCost: item.overheadCost,
        totalDirectCost: item.totalDirectCost,
        costSnapshotDetail: item.costSnapshotDetail,
        manualCostOverride: item.manualCostOverride,
        appliedMarkupRuleId: item.appliedMarkupRuleId,
        appliedMarkupPercent: item.appliedMarkupPercent,
        appliedTargetMarginPercent: item.appliedTargetMarginPercent,
        appliedDiscountRuleId: item.appliedDiscountRuleId,
        appliedDiscountPercent: item.appliedDiscountPercent,
        appliedDiscountAmount: item.appliedDiscountAmount,
        listPrice: item.listPrice,
        netPrice: item.netPrice,
        extendedPrice: item.extendedPrice,
      })),
    );
  }

  await db
    .update(estimateRevisions)
    .set({ isCurrent: false, supersededAt: new Date() })
    .where(eq(estimateRevisions.id, revisionId));

  revalidatePath(`${ESTIMATES_PATH}/${source.estimateId}`);
  return newRevision;
}

// Notes

export async function createNoteAction(
  attachedToType: "estimate" | "estimate_revision" | "estimate_item",
  attachedToId: string,
  estimateId: string,
  values: NoteValues,
) {
  const parsed = noteSchema.parse(values);
  const userId = await getCurrentUserId();
  await db.insert(notes).values({
    body: parsed.body,
    authorId: userId,
    attachedToType,
    attachedToId,
  });
  revalidatePath(`${ESTIMATES_PATH}/${estimateId}`);
}

export async function deleteNoteAction(id: string, estimateId: string) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath(`${ESTIMATES_PATH}/${estimateId}`);
}

// Attachments — MVP records a filename + URL rather than a real
// upload widget (that would need a dedicated Supabase Storage bucket
// provisioned out of band, like organization-assets was for the
// Company logo). See DECISIONS.md.

export async function createAttachmentAction(
  estimateId: string,
  values: AttachmentValues,
) {
  const parsed = attachmentSchema.parse(values);
  const userId = await getCurrentUserId();
  await db.insert(attachments).values({
    fileUrl: parsed.fileUrl,
    filename: parsed.filename,
    uploadedBy: userId,
    attachedToType: "estimate",
    attachedToId: estimateId,
  });
  revalidatePath(`${ESTIMATES_PATH}/${estimateId}`);
}

export async function deleteAttachmentAction(id: string, estimateId: string) {
  await db.delete(attachments).where(eq(attachments.id, id));
  revalidatePath(`${ESTIMATES_PATH}/${estimateId}`);
}
