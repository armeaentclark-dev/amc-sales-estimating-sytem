import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Singleton table: exactly one row, enforced in application code
// (always upsert against the single seeded row). This is AMC's own
// org/tenant profile — distinct from the domain model's `Company`
// entity, which represents a customer's parent organization.
export const organizationSettings = pgTable("organization_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  taxId: text("tax_id"),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("America/New_York"),
  fiscalYearStartMonth: integer("fiscal_year_start_month").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
