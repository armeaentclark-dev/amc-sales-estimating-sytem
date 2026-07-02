"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createEstimateItemAction,
  deleteEstimateItemAction,
  updateEstimateItemAction,
} from "@/lib/actions/estimates";
import type { getEstimate } from "@/lib/actions/estimates";
import type { productTemplates, products, uoms } from "@/lib/db/schema";
import {
  estimateItemSchema,
  type EstimateItemValues,
} from "@/lib/validations/estimates";

const NONE = "__none__";

type ProductRow = typeof products.$inferSelect;
type ProductTemplateRow = typeof productTemplates.$inferSelect;
type UomRow = typeof uoms.$inferSelect;
type Revision =
  Awaited<ReturnType<typeof getEstimate>> extends {
    revisions: (infer R)[];
  } | null
    ? R
    : never;
type EstimateItem = Revision extends { items: (infer I)[] } ? I : never;

function money(value: string | number | null) {
  if (value === null) return "—";
  return `$${Number(value).toFixed(2)}`;
}

interface EstimateItemsSectionProps {
  revision: Revision;
  isEditable: boolean;
  products: ProductRow[];
  productTemplates: ProductTemplateRow[];
  uoms: UomRow[];
}

export function EstimateItemsSection({
  revision,
  isEditable,
  products,
  productTemplates,
  uoms,
}: EstimateItemsSectionProps) {
  const [editing, setEditing] = React.useState<EstimateItem | "new" | null>(
    null,
  );
  const totals = revision.totals;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Line items</CardTitle>
        {isEditable ? (
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus />
            Add item
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {revision.items.length === 0 ? (
          <EmptyState title="No items yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit cost</TableHead>
                <TableHead>Net price</TableHead>
                <TableHead>Extended</TableHead>
                {isEditable ? <TableHead className="w-20" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {revision.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.lineNumber}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    {item.quantity} {item.uom.code}
                  </TableCell>
                  <TableCell>{money(item.totalDirectCost)}</TableCell>
                  <TableCell>{money(item.netPrice)}</TableCell>
                  <TableCell>{money(item.extendedPrice)}</TableCell>
                  {isEditable ? (
                    <TableCell className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setEditing(item)}
                      >
                        <Pencil />
                      </Button>
                      <DeleteButton id={item.id} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={isEditable ? 5 : 4} className="text-right">
                  Subtotal
                </TableCell>
                <TableCell colSpan={isEditable ? 2 : 2}>
                  {money(totals.subtotal)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={isEditable ? 5 : 4} className="text-right">
                  Tax
                </TableCell>
                <TableCell colSpan={isEditable ? 2 : 2}>
                  {money(totals.tax)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={isEditable ? 5 : 4}
                  className="text-right font-semibold"
                >
                  Total
                </TableCell>
                <TableCell
                  colSpan={isEditable ? 2 : 2}
                  className="font-semibold"
                >
                  {money(totals.total)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={isEditable ? 5 : 4} className="text-right">
                  Margin
                </TableCell>
                <TableCell colSpan={isEditable ? 2 : 2}>
                  {totals.marginPercent !== null
                    ? `${(totals.marginPercent * 100).toFixed(1)}%`
                    : "—"}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
      {isEditable ? (
        <ItemDialog
          revisionId={revision.id}
          item={editing === "new" ? undefined : (editing ?? undefined)}
          products={products}
          productTemplates={productTemplates}
          uoms={uoms}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </Card>
  );
}

function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEstimateItemAction(id);
      toast.success("Item removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={deleting}
      onClick={handleDelete}
    >
      <Trash2 />
    </Button>
  );
}

function ItemDialog({
  revisionId,
  item,
  products,
  productTemplates,
  uoms,
  open,
  onOpenChange,
}: {
  revisionId: string;
  item?: EstimateItem;
  products: ProductRow[];
  productTemplates: ProductTemplateRow[];
  uoms: UomRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EstimateItemValues>({
    resolver: zodResolver(estimateItemSchema),
    defaultValues: {
      productId: item?.productId ?? null,
      productTemplateId: item?.productTemplateId ?? null,
      description: item?.description ?? "",
      quantity: item?.quantity ?? "1",
      uomId: item?.uomId ?? "",
      manualCostOverride: item?.manualCostOverride ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        productId: item?.productId ?? null,
        productTemplateId: item?.productTemplateId ?? null,
        description: item?.description ?? "",
        quantity: item?.quantity ?? "1",
        uomId: item?.uomId ?? "",
        manualCostOverride: item?.manualCostOverride ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const productId = watch("productId");
  const productTemplateId = watch("productTemplateId");
  const uomId = watch("uomId");

  async function onSubmit(values: EstimateItemValues) {
    try {
      if (item) {
        await updateEstimateItemAction(item.id, values);
        toast.success("Item saved (pricing recomputed)");
      } else {
        await createEstimateItemAction(revisionId, values);
        toast.success("Item added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save item");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="item-product">
                  Product (optional)
                </FieldLabel>
                <Select
                  value={productId ?? NONE}
                  onValueChange={(value) =>
                    setValue("productId", value === NONE ? null : value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="item-product">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="item-template">
                  Product template
                </FieldLabel>
                <Select
                  value={productTemplateId ?? NONE}
                  onValueChange={(value) =>
                    setValue(
                      "productTemplateId",
                      value === NONE ? null : value,
                      {
                        shouldDirty: true,
                      },
                    )
                  }
                >
                  <SelectTrigger id="item-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {productTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.productTemplateId]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="item-description">Description</FieldLabel>
              <Input id="item-description" {...register("description")} />
              <FieldError errors={[errors.description]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="item-qty">Quantity</FieldLabel>
                <Input
                  id="item-qty"
                  type="number"
                  step="0.0001"
                  {...register("quantity")}
                />
                <FieldError errors={[errors.quantity]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="item-uom">Unit of measure</FieldLabel>
                <Select
                  value={uomId}
                  onValueChange={(value) =>
                    setValue("uomId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="item-uom">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uoms.map((uom) => (
                      <SelectItem key={uom.id} value={uom.id}>
                        {uom.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.uomId]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="item-override">
                Manual cost override (optional — replaces computed cost)
              </FieldLabel>
              <Input
                id="item-override"
                type="number"
                step="0.0001"
                {...register("manualCostOverride")}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Pricing..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
