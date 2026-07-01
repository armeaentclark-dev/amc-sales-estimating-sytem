"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import { addresses, contacts, customers } from "@/lib/db/schema";
import {
  addressSchema,
  contactSchema,
  customerSchema,
  type AddressValues,
  type ContactValues,
  type CustomerValues,
} from "@/lib/validations/customer";

export async function getCustomers() {
  return db.query.customers.findMany({
    orderBy: (customers, { asc }) => [asc(customers.name)],
  });
}

export async function getCustomer(id: string) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: { contacts: true, addresses: true },
  });
  return customer ?? null;
}

export async function createCustomerAction(values: CustomerValues) {
  const parsed = customerSchema.parse(values);
  const [row] = await db.insert(customers).values(parsed).returning();

  revalidatePath("/customers");
  return row;
}

export async function updateCustomerAction(id: string, values: CustomerValues) {
  const parsed = customerSchema.parse(values);
  await db
    .update(customers)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(customers.id, id));

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}

export async function deleteCustomerAction(id: string) {
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/customers");
}

export async function createContactAction(
  customerId: string,
  values: ContactValues,
) {
  const parsed = contactSchema.parse(values);
  await db.insert(contacts).values({ ...parsed, customerId });

  revalidatePath(`/customers/${customerId}`);
}

export async function updateContactAction(
  id: string,
  customerId: string,
  values: ContactValues,
) {
  const parsed = contactSchema.parse(values);
  await db
    .update(contacts)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(contacts.id, id));

  revalidatePath(`/customers/${customerId}`);
}

export async function deleteContactAction(id: string, customerId: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath(`/customers/${customerId}`);
}

export async function createAddressAction(
  customerId: string,
  values: AddressValues,
) {
  const parsed = addressSchema.parse(values);
  await db.insert(addresses).values({ ...parsed, customerId });

  revalidatePath(`/customers/${customerId}`);
}

export async function updateAddressAction(
  id: string,
  customerId: string,
  values: AddressValues,
) {
  const parsed = addressSchema.parse(values);
  await db
    .update(addresses)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(addresses.id, id));

  revalidatePath(`/customers/${customerId}`);
}

export async function deleteAddressAction(id: string, customerId: string) {
  await db.delete(addresses).where(eq(addresses.id, id));
  revalidatePath(`/customers/${customerId}`);
}
