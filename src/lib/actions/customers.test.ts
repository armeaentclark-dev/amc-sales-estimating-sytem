import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import {
  createAddressAction,
  createContactAction,
  createCustomerAction,
  deleteCustomerAction,
  getCustomer,
  getCustomers,
  updateCustomerAction,
} from "@/lib/actions/customers";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";

// Smoke tests for the Customer CRUD actions, including the nested
// Contact/Address creation flow. next/cache's revalidatePath is
// mocked globally in vitest.setup.ts (see there for why).
const NAME_PREFIX = "__vitest__ customer";

const createdCustomerIds: string[] = [];

afterAll(async () => {
  for (const id of createdCustomerIds) {
    await db.delete(customers).where(eq(customers.id, id));
  }
});

describe("createCustomerAction / updateCustomerAction / deleteCustomerAction", () => {
  it("creates a customer with a generated CUS-NNNNNN number", async () => {
    const row = await createCustomerAction({
      name: `${NAME_PREFIX} create`,
      status: "prospect",
      paymentTerms: "Net 30",
    });
    expect(row).toBeTruthy();
    if (!row) return;
    createdCustomerIds.push(row.id);
    expect(row.customerNumber).toMatch(/^CUS-\d{6}$/);
    expect(row.status).toBe("prospect");
  });

  it("updates a customer's fields", async () => {
    const row = await createCustomerAction({
      name: `${NAME_PREFIX} update`,
      status: "prospect",
      paymentTerms: "",
    });
    if (!row) throw new Error("setup failed");
    createdCustomerIds.push(row.id);

    await updateCustomerAction(row.id, {
      name: `${NAME_PREFIX} update (renamed)`,
      status: "active",
      paymentTerms: "Net 60",
    });

    const updated = await getCustomer(row.id);
    expect(updated?.name).toBe(`${NAME_PREFIX} update (renamed)`);
    expect(updated?.status).toBe("active");
    expect(updated?.paymentTerms).toBe("Net 60");
  });

  it("deletes a customer and cascades its contacts/addresses", async () => {
    const row = await createCustomerAction({
      name: `${NAME_PREFIX} delete`,
      status: "prospect",
      paymentTerms: "",
    });
    if (!row) throw new Error("setup failed");

    await createContactAction(row.id, {
      name: "Jane Buyer",
      title: "",
      email: "",
      phone: "",
      isPrimary: true,
    });
    await createAddressAction(row.id, {
      type: "billing",
      line1: "123 Main St",
      line2: "",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "US",
    });

    const withChildren = await getCustomer(row.id);
    expect(withChildren?.contacts).toHaveLength(1);
    expect(withChildren?.addresses).toHaveLength(1);

    await deleteCustomerAction(row.id);

    const afterDelete = await getCustomer(row.id);
    expect(afterDelete).toBeNull();
  });
});

describe("getCustomers", () => {
  it("includes newly created customers in the list", async () => {
    const row = await createCustomerAction({
      name: `${NAME_PREFIX} list`,
      status: "prospect",
      paymentTerms: "",
    });
    if (!row) throw new Error("setup failed");
    createdCustomerIds.push(row.id);

    const all = await getCustomers();
    expect(all.some((c) => c.id === row.id)).toBe(true);
  });
});
