import { relations, sql } from "drizzle-orm";
import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { costCategories, materialCategories, uoms } from "./reference-data";

// material_number's default (MAT-NNNNNN) is set in a hand-written
// migration (0007_cost_library_sequences.sql), the same pattern as
// customer_number in 0003/0004_customer_number_*.sql.
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  materialNumber: text("material_number")
    .notNull()
    .unique()
    .default(sql`generate_material_number()`),
  name: text("name").notNull(),
  materialCategoryId: uuid("material_category_id")
    .notNull()
    .references(() => materialCategories.id),
  uomId: uuid("uom_id")
    .notNull()
    .references(() => uoms.id),
  currentUnitCost: numeric("current_unit_cost", {
    precision: 12,
    scale: 4,
  }).notNull(),
  costCategoryId: uuid("cost_category_id")
    .notNull()
    .references(() => costCategories.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const laborProcesses = pgTable("labor_processes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code")
    .notNull()
    .unique()
    .default(sql`generate_labor_process_number()`),
  name: text("name").notNull(),
  costCategoryId: uuid("cost_category_id")
    .notNull()
    .references(() => costCategories.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// No standalone "number" — internal UUID only, same as Markup/Discount/
// Tax Rule (DOMAIN_MODEL.md §4). "Currently effective" rate is
// resolved by querying effective_date/expires_date, not a maintained
// default-pointer column — see DECISIONS.md for why laborProcesses has
// no default_labor_rate_id (it would create a circular FK for no real
// benefit over an effective-dated query).
export const laborRates = pgTable("labor_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: a null labor_process_id means this is a Cost-Category-
  // level fallback rate (DOMAIN_MODEL.md §3.8 level 4).
  laborProcessId: uuid("labor_process_id").references(() => laborProcesses.id, {
    onDelete: "cascade",
  }),
  costCategoryId: uuid("cost_category_id").references(() => costCategories.id),
  ratePerHour: numeric("rate_per_hour", { precision: 12, scale: 4 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  expiresDate: date("expires_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipmentNumber: text("equipment_number")
    .notNull()
    .unique()
    .default(sql`generate_equipment_number()`),
  name: text("name").notNull(),
  costCategoryId: uuid("cost_category_id")
    .notNull()
    .references(() => costCategories.id),
  ratePerHour: numeric("rate_per_hour", { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const materialsRelations = relations(materials, ({ one }) => ({
  materialCategory: one(materialCategories, {
    fields: [materials.materialCategoryId],
    references: [materialCategories.id],
  }),
  uom: one(uoms, { fields: [materials.uomId], references: [uoms.id] }),
  costCategory: one(costCategories, {
    fields: [materials.costCategoryId],
    references: [costCategories.id],
  }),
}));

export const laborProcessesRelations = relations(
  laborProcesses,
  ({ one, many }) => ({
    costCategory: one(costCategories, {
      fields: [laborProcesses.costCategoryId],
      references: [costCategories.id],
    }),
    laborRates: many(laborRates),
  }),
);

export const laborRatesRelations = relations(laborRates, ({ one }) => ({
  laborProcess: one(laborProcesses, {
    fields: [laborRates.laborProcessId],
    references: [laborProcesses.id],
  }),
  costCategory: one(costCategories, {
    fields: [laborRates.costCategoryId],
    references: [costCategories.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  costCategory: one(costCategories, {
    fields: [equipment.costCategoryId],
    references: [costCategories.id],
  }),
}));
