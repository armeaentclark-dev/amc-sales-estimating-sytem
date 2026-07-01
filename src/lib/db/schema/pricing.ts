import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  numeric,
} from "drizzle-orm/pg-core";

import { productCategories } from "./reference-data";
import { customers } from "./customers";

// Markup/Discount/Customer Pricing Agreement scope_id columns are
// deliberately plain uuid with no FK constraint: they're polymorphic
// (point at different tables depending on scope_type), the same
// pattern the domain model itself uses for Attachment/Note's
// "attached_to". See DECISIONS.md.

export const markupScopeTypeEnum = pgEnum("markup_scope_type", [
  "product_category",
  "product_template",
  "customer",
]);

// No business number — internal UUID only, referenced by scope
// (DOMAIN_MODEL.md §4).
export const markupRules = pgTable("markup_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  scopeType: markupScopeTypeEnum("scope_type").notNull(),
  scopeId: uuid("scope_id").notNull(),
  // Exactly one of these two should be set (app-level validation, not
  // a DB constraint) — DOMAIN_MODEL.md §1.2 phrases it as "markup_percent
  // or target_margin_percent".
  markupPercent: numeric("markup_percent", { precision: 7, scale: 4 }),
  targetMarginPercent: numeric("target_margin_percent", {
    precision: 7,
    scale: 4,
  }),
  effectiveDate: date("effective_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const discountScopeTypeEnum = pgEnum("discount_scope_type", [
  "customer",
  "estimate",
]);

export const discountRules = pgTable("discount_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  scopeType: discountScopeTypeEnum("scope_type").notNull(),
  scopeId: uuid("scope_id").notNull(),
  // Exactly one of these two should be set (app-level validation).
  discountPercent: numeric("discount_percent", { precision: 7, scale: 4 }),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 4 }),
  minQuantity: numeric("min_quantity", { precision: 12, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const taxRules = pgTable("tax_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdiction: text("jurisdiction").notNull(),
  ratePercent: numeric("rate_percent", { precision: 7, scale: 4 }).notNull(),
  // Nullable: applies to all product categories when unset.
  productCategoryId: uuid("product_category_id").references(
    () => productCategories.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pricingAgreementScopeTypeEnum = pgEnum(
  "pricing_agreement_scope_type",
  ["material", "labor_process"],
);

// DOMAIN_MODEL.md §6.3 recommendation — referenced as "future entity"
// in both the material (§3.7) and labor (§3.8) pricing hierarchies at
// the "customer-specific negotiated price/rate" level.
export const customerPricingAgreements = pgTable(
  "customer_pricing_agreements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    scopeType: pricingAgreementScopeTypeEnum("scope_type").notNull(),
    scopeId: uuid("scope_id").notNull(),
    negotiatedRate: numeric("negotiated_rate", {
      precision: 12,
      scale: 4,
    }).notNull(),
    effectiveDate: date("effective_date").notNull(),
    expiresDate: date("expires_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

// DOMAIN_MODEL.md §6.4 recommendation — the margin-floor/value-ceiling
// rules that trigger required Approval (§3.3). Null productCategoryId
// = applies globally; a category-scoped row overrides the global one
// (resolution logic lands with the Estimate approval workflow).
export const approvalThresholds = pgTable("approval_thresholds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  marginFloorPercent: numeric("margin_floor_percent", {
    precision: 7,
    scale: 4,
  }),
  valueCeiling: numeric("value_ceiling", { precision: 14, scale: 4 }),
  productCategoryId: uuid("product_category_id").references(
    () => productCategories.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const taxRulesRelations = relations(taxRules, ({ one }) => ({
  productCategory: one(productCategories, {
    fields: [taxRules.productCategoryId],
    references: [productCategories.id],
  }),
}));

export const customerPricingAgreementsRelations = relations(
  customerPricingAgreements,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerPricingAgreements.customerId],
      references: [customers.id],
    }),
  }),
);

export const approvalThresholdsRelations = relations(
  approvalThresholds,
  ({ one }) => ({
    productCategory: one(productCategories, {
      fields: [approvalThresholds.productCategoryId],
      references: [productCategories.id],
    }),
  }),
);
