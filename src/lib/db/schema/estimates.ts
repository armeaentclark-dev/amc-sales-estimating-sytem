import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { customers } from "./customers";
import { discountRules, markupRules } from "./pricing";
import { productTemplates, products } from "./products";
import { uoms } from "./reference-data";
import { users } from "./users";

// Estimate Status is a lookup + state machine table, not an enum —
// DOMAIN_MODEL.md §3.1/§3.4 needs is_terminal and allowed_next_states
// metadata alongside each state, the same reasoning that kept Estimate
// Status a real table in the domain model rather than a plain enum.
export const estimateStatuses = pgTable("estimate_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  isTerminal: boolean("is_terminal").notNull().default(false),
  // Array of estimate_statuses.code this state can transition to —
  // DOMAIN_MODEL.md §3.4. Enforced in application code (server
  // actions), not a DB constraint.
  allowedNextStates: text("allowed_next_states").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// EST-YYYY-NNNNNN resets every calendar year (DOMAIN_MODEL.md §4) — a
// plain Postgres SEQUENCE can't do that on its own, so this is a
// per-year counter row instead. generate_estimate_number() upserts it
// atomically (ON CONFLICT DO UPDATE ... RETURNING), which is
// concurrency-safe the same way nextval() is. See
// 0018_estimate_number_counter.sql and DECISIONS.md.
export const estimateNumberCounters = pgTable("estimate_number_counters", {
  year: text("year").primaryKey(),
  lastNumber: integer("last_number").notNull().default(0),
});

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateNumber: text("estimate_number")
    .notNull()
    .unique()
    .default(sql`generate_estimate_number()`),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  salespersonId: uuid("salesperson_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  currency: text("currency").notNull().default("USD"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const estimateRevisions = pgTable("estimate_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id, { onDelete: "cascade" }),
  revisionNumber: integer("revision_number").notNull(),
  statusId: uuid("status_id")
    .notNull()
    .references(() => estimateStatuses.id),
  // Exactly one revision per estimate should have isCurrent = true —
  // enforced in application code (DOMAIN_MODEL.md §3.2), not a DB
  // constraint (a partial unique index would need statusId-agnostic
  // uniqueness on (estimate_id) WHERE is_current, which is fine too,
  // but app-level is simpler and matches how customer_number-style
  // invariants are already handled elsewhere in this codebase).
  isCurrent: boolean("is_current").notNull().default(true),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const estimateItems = pgTable("estimate_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateRevisionId: uuid("estimate_revision_id")
    .notNull()
    .references(() => estimateRevisions.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  productId: uuid("product_id").references(() => products.id),
  productTemplateId: uuid("product_template_id").references(
    () => productTemplates.id,
  ),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  uomId: uuid("uom_id")
    .notNull()
    .references(() => uoms.id),

  // Cost snapshot (DOMAIN_MODEL.md §1.3/§3.5) — resolved at
  // creation/re-price time, never live-computed on read. Aggregate
  // totals are real numeric columns (needed for sums/sorting);
  // `costSnapshotDetail` holds the itemized resolution trail (which
  // BOM/labor/equipment/overhead lines, which pricing-hierarchy level
  // resolved each cost, effective dates) as JSON rather than dozens
  // of columns — see DECISIONS.md.
  materialCost: numeric("material_cost", { precision: 14, scale: 4 }),
  laborCost: numeric("labor_cost", { precision: 14, scale: 4 }),
  equipmentCost: numeric("equipment_cost", { precision: 14, scale: 4 }),
  overheadCost: numeric("overhead_cost", { precision: 14, scale: 4 }),
  totalDirectCost: numeric("total_direct_cost", { precision: 14, scale: 4 }),
  costSnapshotDetail: jsonb("cost_snapshot_detail"),

  // §3.7/§3.8 hierarchy level 1: manual override wins over every
  // resolved cost when set.
  manualCostOverride: numeric("manual_cost_override", {
    precision: 14,
    scale: 4,
  }),

  appliedMarkupRuleId: uuid("applied_markup_rule_id").references(
    () => markupRules.id,
  ),
  appliedMarkupPercent: numeric("applied_markup_percent", {
    precision: 7,
    scale: 4,
  }),
  appliedTargetMarginPercent: numeric("applied_target_margin_percent", {
    precision: 7,
    scale: 4,
  }),

  appliedDiscountRuleId: uuid("applied_discount_rule_id").references(
    () => discountRules.id,
  ),
  appliedDiscountPercent: numeric("applied_discount_percent", {
    precision: 7,
    scale: 4,
  }),
  appliedDiscountAmount: numeric("applied_discount_amount", {
    precision: 14,
    scale: 4,
  }),

  listPrice: numeric("list_price", { precision: 14, scale: 4 }),
  netPrice: numeric("net_price", { precision: 14, scale: 4 }),
  extendedPrice: numeric("extended_price", { precision: 14, scale: 4 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvalDecisionEnum = pgEnum("approval_decision", [
  "approved",
  "rejected",
]);

// Internal UUID only — Approvals are workflow records, not
// customer/user-facing "numbers" (DOMAIN_MODEL.md §4). Immutable once
// recorded (§3.3) — no update action, only create.
export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateRevisionId: uuid("estimate_revision_id")
    .notNull()
    .references(() => estimateRevisions.id, { onDelete: "cascade" }),
  approverId: uuid("approver_id")
    .notNull()
    .references(() => users.id),
  decision: approvalDecisionEnum("decision").notNull(),
  thresholdReason: text("threshold_reason"),
  comment: text("comment"),
  decidedAt: timestamp("decided_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const attachmentTargetTypeEnum = pgEnum("attachment_target_type", [
  "estimate",
  "estimate_item",
]);

// attachedToId is polymorphic (target table depends on
// attachedToType) — plain uuid, no FK, same pattern as pricing.ts's
// scope_id columns.
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileUrl: text("file_url").notNull(),
  filename: text("filename").notNull(),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  attachedToType: attachmentTargetTypeEnum("attached_to_type").notNull(),
  attachedToId: uuid("attached_to_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const noteTargetTypeEnum = pgEnum("note_target_type", [
  "estimate",
  "estimate_revision",
  "estimate_item",
]);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  body: text("body").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  attachedToType: noteTargetTypeEnum("attached_to_type").notNull(),
  attachedToId: uuid("attached_to_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  customer: one(customers, {
    fields: [estimates.customerId],
    references: [customers.id],
  }),
  salesperson: one(users, {
    fields: [estimates.salespersonId],
    references: [users.id],
  }),
  revisions: many(estimateRevisions),
}));

export const estimateRevisionsRelations = relations(
  estimateRevisions,
  ({ one, many }) => ({
    estimate: one(estimates, {
      fields: [estimateRevisions.estimateId],
      references: [estimates.id],
    }),
    status: one(estimateStatuses, {
      fields: [estimateRevisions.statusId],
      references: [estimateStatuses.id],
    }),
    createdByUser: one(users, {
      fields: [estimateRevisions.createdBy],
      references: [users.id],
    }),
    items: many(estimateItems),
    approvals: many(approvals),
  }),
);

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimateRevision: one(estimateRevisions, {
    fields: [estimateItems.estimateRevisionId],
    references: [estimateRevisions.id],
  }),
  product: one(products, {
    fields: [estimateItems.productId],
    references: [products.id],
  }),
  productTemplate: one(productTemplates, {
    fields: [estimateItems.productTemplateId],
    references: [productTemplates.id],
  }),
  uom: one(uoms, { fields: [estimateItems.uomId], references: [uoms.id] }),
  appliedMarkupRule: one(markupRules, {
    fields: [estimateItems.appliedMarkupRuleId],
    references: [markupRules.id],
  }),
  appliedDiscountRule: one(discountRules, {
    fields: [estimateItems.appliedDiscountRuleId],
    references: [discountRules.id],
  }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  estimateRevision: one(estimateRevisions, {
    fields: [approvals.estimateRevisionId],
    references: [estimateRevisions.id],
  }),
  approver: one(users, {
    fields: [approvals.approverId],
    references: [users.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  author: one(users, { fields: [notes.authorId], references: [users.id] }),
}));
