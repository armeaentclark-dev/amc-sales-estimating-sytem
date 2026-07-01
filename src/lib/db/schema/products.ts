import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import {
  bomTemplates,
  equipmentTemplates,
  laborTemplates,
  overheadTemplates,
} from "./cost-library-templates";
import { productCategories } from "./reference-data";

// The composition root of the Cost Library for a configurable product
// (DOMAIN_MODEL.md §1.2). Sub-template FKs are nullable — a Product
// Template doesn't have to define all four cost dimensions up front.
export const productTemplates = pgTable("product_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateNumber: text("template_number")
    .notNull()
    .unique()
    .default(sql`generate_product_template_number()`),
  name: text("name").notNull(),
  productCategoryId: uuid("product_category_id")
    .notNull()
    .references(() => productCategories.id),
  bomTemplateId: uuid("bom_template_id").references(() => bomTemplates.id),
  laborTemplateId: uuid("labor_template_id").references(
    () => laborTemplates.id,
  ),
  equipmentTemplateId: uuid("equipment_template_id").references(
    () => equipmentTemplates.id,
  ),
  overheadTemplateId: uuid("overhead_template_id").references(
    () => overheadTemplates.id,
  ),
  // No FK yet — Markup Rule doesn't exist until the Pricing Rules
  // phase. Same deferred-column pattern as customers.companyId.
  defaultMarkupRuleId: uuid("default_markup_rule_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  productNumber: text("product_number")
    .notNull()
    .unique()
    .default(sql`generate_product_number()`),
  name: text("name").notNull(),
  productCategoryId: uuid("product_category_id")
    .notNull()
    .references(() => productCategories.id),
  productTemplateId: uuid("product_template_id").references(
    () => productTemplates.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const productTemplatesRelations = relations(
  productTemplates,
  ({ one, many }) => ({
    productCategory: one(productCategories, {
      fields: [productTemplates.productCategoryId],
      references: [productCategories.id],
    }),
    bomTemplate: one(bomTemplates, {
      fields: [productTemplates.bomTemplateId],
      references: [bomTemplates.id],
    }),
    laborTemplate: one(laborTemplates, {
      fields: [productTemplates.laborTemplateId],
      references: [laborTemplates.id],
    }),
    equipmentTemplate: one(equipmentTemplates, {
      fields: [productTemplates.equipmentTemplateId],
      references: [equipmentTemplates.id],
    }),
    overheadTemplate: one(overheadTemplates, {
      fields: [productTemplates.overheadTemplateId],
      references: [overheadTemplates.id],
    }),
    products: many(products),
  }),
);

export const productsRelations = relations(products, ({ one }) => ({
  productCategory: one(productCategories, {
    fields: [products.productCategoryId],
    references: [productCategories.id],
  }),
  productTemplate: one(productTemplates, {
    fields: [products.productTemplateId],
    references: [productTemplates.id],
  }),
}));
