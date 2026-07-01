"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import {
  bomTemplateLines,
  bomTemplates,
  equipmentTemplateLines,
  equipmentTemplates,
  laborTemplateLines,
  laborTemplates,
  overheadTemplateLines,
  overheadTemplates,
} from "@/lib/db/schema";
import {
  bomTemplateLineSchema,
  bomTemplateSchema,
  equipmentTemplateLineSchema,
  equipmentTemplateSchema,
  laborTemplateLineSchema,
  laborTemplateSchema,
  overheadTemplateLineSchema,
  overheadTemplateSchema,
  type BomTemplateLineValues,
  type BomTemplateValues,
  type EquipmentTemplateLineValues,
  type EquipmentTemplateValues,
  type LaborTemplateLineValues,
  type LaborTemplateValues,
  type OverheadTemplateLineValues,
  type OverheadTemplateValues,
} from "@/lib/validations/cost-library-templates";

const TEMPLATES_PATH = "/cost-library/templates";

// BOM Template

export async function getBomTemplates() {
  return db.query.bomTemplates.findMany({
    orderBy: (bomTemplates, { asc }) => [asc(bomTemplates.name)],
    with: { lines: { with: { material: true, uom: true } } },
  });
}

export async function createBomTemplateAction(values: BomTemplateValues) {
  const parsed = bomTemplateSchema.parse(values);
  const [row] = await db.insert(bomTemplates).values(parsed).returning();
  revalidatePath(TEMPLATES_PATH);
  return row;
}

export async function updateBomTemplateAction(
  id: string,
  values: BomTemplateValues,
) {
  const parsed = bomTemplateSchema.parse(values);
  await db
    .update(bomTemplates)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(bomTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteBomTemplateAction(id: string) {
  await db.delete(bomTemplates).where(eq(bomTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function createBomTemplateLineAction(
  bomTemplateId: string,
  values: BomTemplateLineValues,
) {
  const parsed = bomTemplateLineSchema.parse(values);
  await db.insert(bomTemplateLines).values({ ...parsed, bomTemplateId });
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteBomTemplateLineAction(id: string) {
  await db.delete(bomTemplateLines).where(eq(bomTemplateLines.id, id));
  revalidatePath(TEMPLATES_PATH);
}

// Labor Template

export async function getLaborTemplates() {
  return db.query.laborTemplates.findMany({
    orderBy: (laborTemplates, { asc }) => [asc(laborTemplates.name)],
    with: { lines: { with: { laborProcess: true } } },
  });
}

export async function createLaborTemplateAction(values: LaborTemplateValues) {
  const parsed = laborTemplateSchema.parse(values);
  await db.insert(laborTemplates).values(parsed);
  revalidatePath(TEMPLATES_PATH);
}

export async function updateLaborTemplateAction(
  id: string,
  values: LaborTemplateValues,
) {
  const parsed = laborTemplateSchema.parse(values);
  await db
    .update(laborTemplates)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(laborTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteLaborTemplateAction(id: string) {
  await db.delete(laborTemplates).where(eq(laborTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function createLaborTemplateLineAction(
  laborTemplateId: string,
  values: LaborTemplateLineValues,
) {
  const parsed = laborTemplateLineSchema.parse(values);
  await db.insert(laborTemplateLines).values({ ...parsed, laborTemplateId });
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteLaborTemplateLineAction(id: string) {
  await db.delete(laborTemplateLines).where(eq(laborTemplateLines.id, id));
  revalidatePath(TEMPLATES_PATH);
}

// Equipment Template

export async function getEquipmentTemplates() {
  return db.query.equipmentTemplates.findMany({
    orderBy: (equipmentTemplates, { asc }) => [asc(equipmentTemplates.name)],
    with: { lines: { with: { equipment: true } } },
  });
}

export async function createEquipmentTemplateAction(
  values: EquipmentTemplateValues,
) {
  const parsed = equipmentTemplateSchema.parse(values);
  await db.insert(equipmentTemplates).values(parsed);
  revalidatePath(TEMPLATES_PATH);
}

export async function updateEquipmentTemplateAction(
  id: string,
  values: EquipmentTemplateValues,
) {
  const parsed = equipmentTemplateSchema.parse(values);
  await db
    .update(equipmentTemplates)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(equipmentTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteEquipmentTemplateAction(id: string) {
  await db.delete(equipmentTemplates).where(eq(equipmentTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function createEquipmentTemplateLineAction(
  equipmentTemplateId: string,
  values: EquipmentTemplateLineValues,
) {
  const parsed = equipmentTemplateLineSchema.parse(values);
  await db
    .insert(equipmentTemplateLines)
    .values({ ...parsed, equipmentTemplateId });
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteEquipmentTemplateLineAction(id: string) {
  await db
    .delete(equipmentTemplateLines)
    .where(eq(equipmentTemplateLines.id, id));
  revalidatePath(TEMPLATES_PATH);
}

// Overhead Template

export async function getOverheadTemplates() {
  return db.query.overheadTemplates.findMany({
    orderBy: (overheadTemplates, { asc }) => [asc(overheadTemplates.name)],
    with: { lines: { with: { costCategory: true } } },
  });
}

export async function createOverheadTemplateAction(
  values: OverheadTemplateValues,
) {
  const parsed = overheadTemplateSchema.parse(values);
  await db.insert(overheadTemplates).values(parsed);
  revalidatePath(TEMPLATES_PATH);
}

export async function updateOverheadTemplateAction(
  id: string,
  values: OverheadTemplateValues,
) {
  const parsed = overheadTemplateSchema.parse(values);
  await db
    .update(overheadTemplates)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(overheadTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteOverheadTemplateAction(id: string) {
  await db.delete(overheadTemplates).where(eq(overheadTemplates.id, id));
  revalidatePath(TEMPLATES_PATH);
}

export async function createOverheadTemplateLineAction(
  overheadTemplateId: string,
  values: OverheadTemplateLineValues,
) {
  const parsed = overheadTemplateLineSchema.parse(values);
  await db
    .insert(overheadTemplateLines)
    .values({ ...parsed, overheadTemplateId });
  revalidatePath(TEMPLATES_PATH);
}

export async function deleteOverheadTemplateLineAction(id: string) {
  await db
    .delete(overheadTemplateLines)
    .where(eq(overheadTemplateLines.id, id));
  revalidatePath(TEMPLATES_PATH);
}
