import { relations, sql } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const customerStatusEnum = pgEnum("customer_status", [
  "prospect",
  "active",
  "inactive",
]);

export const addressTypeEnum = pgEnum("address_type", ["billing", "shipping"]);

// customer_number's default (CUS-NNNNNN via a sequence) is set in a
// hand-written migration — see src/lib/db/migrations/0003_customer_number_sequence.sql,
// mirroring how 0001_auth_trigger.sql hand-writes SQL Drizzle can't express.
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerNumber: text("customer_number")
    .notNull()
    .unique()
    .default(sql`generate_customer_number()`),
  name: text("name").notNull(),
  status: customerStatusEnum("status").notNull().default("prospect"),
  paymentTerms: text("payment_terms"),
  // No FK yet — the Company (parent org rollup) entity is deferred past
  // this phase. Column exists so it doesn't require a later migration
  // to add.
  companyId: uuid("company_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  type: addressTypeEnum("type").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("US"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  contacts: many(contacts),
  addresses: many(addresses),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customerId],
    references: [customers.id],
  }),
}));
