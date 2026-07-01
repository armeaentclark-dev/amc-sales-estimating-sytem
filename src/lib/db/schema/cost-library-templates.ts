import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { equipment, laborProcesses, materials } from "./cost-library";
import { costCategories, uoms } from "./reference-data";

// All four Template + Template Line pairs live in one file since Line
// tables reference their parent Template with a many() relation on
// the Template side — see the circular-import lesson in
// src/lib/db/schema/customers.ts.

export const bomTemplates = pgTable("bom_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateNumber: text("template_number")
    .notNull()
    .unique()
    .default(sql`generate_bom_template_number()`),
  name: text("name").notNull(),
  revision: integer("revision").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bomTemplateLines = pgTable("bom_template_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  bomTemplateId: uuid("bom_template_id")
    .notNull()
    .references(() => bomTemplates.id, { onDelete: "cascade" }),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  uomId: uuid("uom_id")
    .notNull()
    .references(() => uoms.id),
  scrapPercent: numeric("scrap_percent", { precision: 5, scale: 4 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const laborTemplates = pgTable("labor_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateNumber: text("template_number")
    .notNull()
    .unique()
    .default(sql`generate_labor_template_number()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const laborTemplateLines = pgTable("labor_template_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  laborTemplateId: uuid("labor_template_id")
    .notNull()
    .references(() => laborTemplates.id, { onDelete: "cascade" }),
  laborProcessId: uuid("labor_process_id")
    .notNull()
    .references(() => laborProcesses.id),
  standardHours: numeric("standard_hours", {
    precision: 10,
    scale: 4,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const equipmentTemplates = pgTable("equipment_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateNumber: text("template_number")
    .notNull()
    .unique()
    .default(sql`generate_equipment_template_number()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const equipmentTemplateLines = pgTable("equipment_template_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipmentTemplateId: uuid("equipment_template_id")
    .notNull()
    .references(() => equipmentTemplates.id, { onDelete: "cascade" }),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id),
  standardHours: numeric("standard_hours", {
    precision: 10,
    scale: 4,
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const overheadAllocationMethodEnum = pgEnum(
  "overhead_allocation_method",
  ["percent_of_labor", "percent_of_direct_cost", "flat_per_unit"],
);

export const overheadTemplates = pgTable("overhead_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateNumber: text("template_number")
    .notNull()
    .unique()
    .default(sql`generate_overhead_template_number()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const overheadTemplateLines = pgTable("overhead_template_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  overheadTemplateId: uuid("overhead_template_id")
    .notNull()
    .references(() => overheadTemplates.id, { onDelete: "cascade" }),
  costCategoryId: uuid("cost_category_id")
    .notNull()
    .references(() => costCategories.id),
  allocationMethod: overheadAllocationMethodEnum("allocation_method").notNull(),
  rate: numeric("rate", { precision: 12, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bomTemplatesRelations = relations(bomTemplates, ({ many }) => ({
  lines: many(bomTemplateLines),
}));

export const bomTemplateLinesRelations = relations(
  bomTemplateLines,
  ({ one }) => ({
    bomTemplate: one(bomTemplates, {
      fields: [bomTemplateLines.bomTemplateId],
      references: [bomTemplates.id],
    }),
    material: one(materials, {
      fields: [bomTemplateLines.materialId],
      references: [materials.id],
    }),
    uom: one(uoms, { fields: [bomTemplateLines.uomId], references: [uoms.id] }),
  }),
);

export const laborTemplatesRelations = relations(
  laborTemplates,
  ({ many }) => ({
    lines: many(laborTemplateLines),
  }),
);

export const laborTemplateLinesRelations = relations(
  laborTemplateLines,
  ({ one }) => ({
    laborTemplate: one(laborTemplates, {
      fields: [laborTemplateLines.laborTemplateId],
      references: [laborTemplates.id],
    }),
    laborProcess: one(laborProcesses, {
      fields: [laborTemplateLines.laborProcessId],
      references: [laborProcesses.id],
    }),
  }),
);

export const equipmentTemplatesRelations = relations(
  equipmentTemplates,
  ({ many }) => ({
    lines: many(equipmentTemplateLines),
  }),
);

export const equipmentTemplateLinesRelations = relations(
  equipmentTemplateLines,
  ({ one }) => ({
    equipmentTemplate: one(equipmentTemplates, {
      fields: [equipmentTemplateLines.equipmentTemplateId],
      references: [equipmentTemplates.id],
    }),
    equipment: one(equipment, {
      fields: [equipmentTemplateLines.equipmentId],
      references: [equipment.id],
    }),
  }),
);

export const overheadTemplatesRelations = relations(
  overheadTemplates,
  ({ many }) => ({
    lines: many(overheadTemplateLines),
  }),
);

export const overheadTemplateLinesRelations = relations(
  overheadTemplateLines,
  ({ one }) => ({
    overheadTemplate: one(overheadTemplates, {
      fields: [overheadTemplateLines.overheadTemplateId],
      references: [overheadTemplates.id],
    }),
    costCategory: one(costCategories, {
      fields: [overheadTemplateLines.costCategoryId],
      references: [costCategories.id],
    }),
  }),
);
