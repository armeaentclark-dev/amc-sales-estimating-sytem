"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import { productTemplates, products } from "@/lib/db/schema";
import {
  productSchema,
  productTemplateSchema,
  type ProductTemplateValues,
  type ProductValues,
} from "@/lib/validations/products";

const PRODUCTS_PATH = "/products";

export async function getProductTemplates() {
  return db.query.productTemplates.findMany({
    orderBy: (productTemplates, { asc }) => [asc(productTemplates.name)],
    with: {
      productCategory: true,
      bomTemplate: true,
      laborTemplate: true,
      equipmentTemplate: true,
      overheadTemplate: true,
    },
  });
}

export async function createProductTemplateAction(
  values: ProductTemplateValues,
) {
  const parsed = productTemplateSchema.parse(values);
  await db.insert(productTemplates).values({
    name: parsed.name,
    productCategoryId: parsed.productCategoryId,
    bomTemplateId: parsed.bomTemplateId || null,
    laborTemplateId: parsed.laborTemplateId || null,
    equipmentTemplateId: parsed.equipmentTemplateId || null,
    overheadTemplateId: parsed.overheadTemplateId || null,
  });
  revalidatePath(PRODUCTS_PATH);
}

export async function updateProductTemplateAction(
  id: string,
  values: ProductTemplateValues,
) {
  const parsed = productTemplateSchema.parse(values);
  await db
    .update(productTemplates)
    .set({
      name: parsed.name,
      productCategoryId: parsed.productCategoryId,
      bomTemplateId: parsed.bomTemplateId || null,
      laborTemplateId: parsed.laborTemplateId || null,
      equipmentTemplateId: parsed.equipmentTemplateId || null,
      overheadTemplateId: parsed.overheadTemplateId || null,
      updatedAt: new Date(),
    })
    .where(eq(productTemplates.id, id));
  revalidatePath(PRODUCTS_PATH);
}

export async function deleteProductTemplateAction(id: string) {
  await db.delete(productTemplates).where(eq(productTemplates.id, id));
  revalidatePath(PRODUCTS_PATH);
}

export async function getProducts() {
  return db.query.products.findMany({
    orderBy: (products, { asc }) => [asc(products.name)],
    with: { productCategory: true, productTemplate: true },
  });
}

export async function createProductAction(values: ProductValues) {
  const parsed = productSchema.parse(values);
  await db.insert(products).values({
    name: parsed.name,
    productCategoryId: parsed.productCategoryId,
    productTemplateId: parsed.productTemplateId || null,
  });
  revalidatePath(PRODUCTS_PATH);
}

export async function updateProductAction(id: string, values: ProductValues) {
  const parsed = productSchema.parse(values);
  await db
    .update(products)
    .set({
      name: parsed.name,
      productCategoryId: parsed.productCategoryId,
      productTemplateId: parsed.productTemplateId || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));
  revalidatePath(PRODUCTS_PATH);
}

export async function deleteProductAction(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath(PRODUCTS_PATH);
}
