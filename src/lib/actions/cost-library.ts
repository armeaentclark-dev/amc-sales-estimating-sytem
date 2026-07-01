"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import {
  equipment,
  laborProcesses,
  laborRates,
  materials,
} from "@/lib/db/schema";
import {
  equipmentSchema,
  laborProcessSchema,
  laborRateSchema,
  materialSchema,
  type EquipmentValues,
  type LaborProcessValues,
  type LaborRateValues,
  type MaterialValues,
} from "@/lib/validations/cost-library";

const COST_LIBRARY_PATH = "/cost-library";

// Material

export async function getMaterials() {
  return db.query.materials.findMany({
    orderBy: (materials, { asc }) => [asc(materials.name)],
    with: { materialCategory: true, uom: true, costCategory: true },
  });
}

export async function createMaterialAction(values: MaterialValues) {
  const parsed = materialSchema.parse(values);
  await db.insert(materials).values(parsed);
  revalidatePath(COST_LIBRARY_PATH);
}

export async function updateMaterialAction(id: string, values: MaterialValues) {
  const parsed = materialSchema.parse(values);
  await db
    .update(materials)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(materials.id, id));
  revalidatePath(COST_LIBRARY_PATH);
}

export async function deleteMaterialAction(id: string) {
  await db.delete(materials).where(eq(materials.id, id));
  revalidatePath(COST_LIBRARY_PATH);
}

// Labor Process

export async function getLaborProcesses() {
  return db.query.laborProcesses.findMany({
    orderBy: (laborProcesses, { asc }) => [asc(laborProcesses.name)],
    with: { costCategory: true, laborRates: true },
  });
}

export async function createLaborProcessAction(values: LaborProcessValues) {
  const parsed = laborProcessSchema.parse(values);
  await db.insert(laborProcesses).values(parsed);
  revalidatePath(COST_LIBRARY_PATH);
}

export async function updateLaborProcessAction(
  id: string,
  values: LaborProcessValues,
) {
  const parsed = laborProcessSchema.parse(values);
  await db
    .update(laborProcesses)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(laborProcesses.id, id));
  revalidatePath(COST_LIBRARY_PATH);
}

export async function deleteLaborProcessAction(id: string) {
  await db.delete(laborProcesses).where(eq(laborProcesses.id, id));
  revalidatePath(COST_LIBRARY_PATH);
}

// Labor Rate

export async function createLaborRateAction(values: LaborRateValues) {
  const parsed = laborRateSchema.parse(values);
  await db.insert(laborRates).values({
    laborProcessId: parsed.laborProcessId || null,
    costCategoryId: parsed.costCategoryId || null,
    ratePerHour: parsed.ratePerHour,
    effectiveDate: parsed.effectiveDate,
    expiresDate: parsed.expiresDate || null,
  });
  revalidatePath(COST_LIBRARY_PATH);
}

export async function deleteLaborRateAction(id: string) {
  await db.delete(laborRates).where(eq(laborRates.id, id));
  revalidatePath(COST_LIBRARY_PATH);
}

// Equipment

export async function getEquipment() {
  return db.query.equipment.findMany({
    orderBy: (equipment, { asc }) => [asc(equipment.name)],
    with: { costCategory: true },
  });
}

export async function createEquipmentAction(values: EquipmentValues) {
  const parsed = equipmentSchema.parse(values);
  await db.insert(equipment).values(parsed);
  revalidatePath(COST_LIBRARY_PATH);
}

export async function updateEquipmentAction(
  id: string,
  values: EquipmentValues,
) {
  const parsed = equipmentSchema.parse(values);
  await db
    .update(equipment)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(equipment.id, id));
  revalidatePath(COST_LIBRARY_PATH);
}

export async function deleteEquipmentAction(id: string) {
  await db.delete(equipment).where(eq(equipment.id, id));
  revalidatePath(COST_LIBRARY_PATH);
}
