"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import { organizationSettings } from "@/lib/db/schema";
import {
  organizationSettingsSchema,
  type OrganizationSettingsValues,
} from "@/lib/validations/organization-settings";

export async function getOrganizationSettings() {
  const [row] = await db.select().from(organizationSettings).limit(1);
  return row ?? null;
}

export async function updateOrganizationSettingsAction(
  values: OrganizationSettingsValues,
) {
  const parsed = organizationSettingsSchema.parse(values);
  const existing = await getOrganizationSettings();

  if (existing) {
    await db
      .update(organizationSettings)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(organizationSettings.id, existing.id));
  } else {
    await db.insert(organizationSettings).values(parsed);
  }

  revalidatePath("/settings/company");
}
