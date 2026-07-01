import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Lookup entity for quantity units (EA, FT, LB, HR, ...). Conversion
// arithmetic between units (DOMAIN_MODEL.md §6.1) is deliberately not
// modeled yet — nothing in the schema so far does cross-unit quantity
// math. Add conversion factors when a real consumer (BOM costing)
// needs them, per DECISIONS.md.
export const uoms = pgTable("uoms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const costTypeEnum = pgEnum("cost_type", [
  "material",
  "labor",
  "equipment",
  "overhead",
]);

// Cross-cutting classification referenced by Material, Labor Process,
// Equipment, and Overhead Template Line (DOMAIN_MODEL.md §1.2).
export const costCategories = pgTable("cost_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  costType: costTypeEnum("cost_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const materialCategories = pgTable("material_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  // Coarse pricing-hierarchy fallback (DOMAIN_MODEL.md §3.7 level 4).
  defaultUnitCost: numeric("default_unit_cost", { precision: 12, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  parentCategoryId: uuid("parent_category_id").references(
    (): AnyPgColumn => productCategories.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const productCategoriesRelations = relations(
  productCategories,
  ({ one, many }) => ({
    parent: one(productCategories, {
      fields: [productCategories.parentCategoryId],
      references: [productCategories.id],
      relationName: "productCategoryHierarchy",
    }),
    children: many(productCategories, {
      relationName: "productCategoryHierarchy",
    }),
  }),
);
