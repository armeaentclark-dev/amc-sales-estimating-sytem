"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import {
  costCategories,
  materialCategories,
  productCategories,
  uoms,
} from "@/lib/db/schema";
import {
  costCategorySchema,
  materialCategorySchema,
  productCategorySchema,
  uomSchema,
  type CostCategoryValues,
  type MaterialCategoryValues,
  type ProductCategoryValues,
  type UomValues,
} from "@/lib/validations/reference-data";

const REFERENCE_DATA_PATH = "/settings/reference-data";

// UOM

export async function getUoms() {
  return db.query.uoms.findMany({
    orderBy: (uoms, { asc }) => [asc(uoms.code)],
  });
}

export async function createUomAction(values: UomValues) {
  const parsed = uomSchema.parse(values);
  await db.insert(uoms).values(parsed);
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function updateUomAction(id: string, values: UomValues) {
  const parsed = uomSchema.parse(values);
  await db.update(uoms).set(parsed).where(eq(uoms.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function deleteUomAction(id: string) {
  await db.delete(uoms).where(eq(uoms.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}

// Cost Category

export async function getCostCategories() {
  return db.query.costCategories.findMany({
    orderBy: (costCategories, { asc }) => [asc(costCategories.code)],
  });
}

export async function createCostCategoryAction(values: CostCategoryValues) {
  const parsed = costCategorySchema.parse(values);
  await db.insert(costCategories).values(parsed);
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function updateCostCategoryAction(
  id: string,
  values: CostCategoryValues,
) {
  const parsed = costCategorySchema.parse(values);
  await db.update(costCategories).set(parsed).where(eq(costCategories.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function deleteCostCategoryAction(id: string) {
  await db.delete(costCategories).where(eq(costCategories.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}

// Material Category

export async function getMaterialCategories() {
  return db.query.materialCategories.findMany({
    orderBy: (materialCategories, { asc }) => [asc(materialCategories.code)],
  });
}

export async function createMaterialCategoryAction(
  values: MaterialCategoryValues,
) {
  const parsed = materialCategorySchema.parse(values);
  await db.insert(materialCategories).values({
    code: parsed.code,
    name: parsed.name,
    defaultUnitCost:
      parsed.defaultUnitCost === "" ? null : parsed.defaultUnitCost,
  });
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function updateMaterialCategoryAction(
  id: string,
  values: MaterialCategoryValues,
) {
  const parsed = materialCategorySchema.parse(values);
  await db
    .update(materialCategories)
    .set({
      code: parsed.code,
      name: parsed.name,
      defaultUnitCost:
        parsed.defaultUnitCost === "" ? null : parsed.defaultUnitCost,
    })
    .where(eq(materialCategories.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function deleteMaterialCategoryAction(id: string) {
  await db.delete(materialCategories).where(eq(materialCategories.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}

// Product Category

export async function getProductCategories() {
  return db.query.productCategories.findMany({
    orderBy: (productCategories, { asc }) => [asc(productCategories.code)],
  });
}

export async function createProductCategoryAction(
  values: ProductCategoryValues,
) {
  const parsed = productCategorySchema.parse(values);
  await db.insert(productCategories).values({
    code: parsed.code,
    name: parsed.name,
    parentCategoryId: parsed.parentCategoryId || null,
  });
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function updateProductCategoryAction(
  id: string,
  values: ProductCategoryValues,
) {
  const parsed = productCategorySchema.parse(values);
  await db
    .update(productCategories)
    .set({
      code: parsed.code,
      name: parsed.name,
      parentCategoryId: parsed.parentCategoryId || null,
    })
    .where(eq(productCategories.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}

export async function deleteProductCategoryAction(id: string) {
  await db.delete(productCategories).where(eq(productCategories.id, id));
  revalidatePath(REFERENCE_DATA_PATH);
}
