"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

// Read-only — Phase 1 intentionally shipped no Users CRUD UI. This
// just backs the Salesperson picker on the Estimate form.
export async function getUsers() {
  return db.query.users.findMany({
    where: eq(users.isActive, true),
    orderBy: (users, { asc }) => [asc(users.fullName)],
  });
}
