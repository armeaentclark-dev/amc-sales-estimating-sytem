"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/lib/actions/products";
import type {
  productCategories,
  productTemplates,
  products,
} from "@/lib/db/schema";
import { productSchema, type ProductValues } from "@/lib/validations/products";

const NONE = "__none__";

type ProductCategoryRow = typeof productCategories.$inferSelect;
type ProductTemplateRow = typeof productTemplates.$inferSelect;

type Product = typeof products.$inferSelect & {
  productCategory: ProductCategoryRow;
  productTemplate: ProductTemplateRow | null;
};

interface ProductPanelProps {
  items: Product[];
  productCategories: ProductCategoryRow[];
  productTemplates: ProductTemplateRow[];
}

export function ProductPanel({
  items,
  productCategories,
  productTemplates,
}: ProductPanelProps) {
  const [editing, setEditing] = React.useState<Product | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add product
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No products yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Template</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.productNumber}
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.productCategory.name}</TableCell>
                <TableCell>
                  {item.productTemplate?.templateNumber ?? "—"}
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ProductDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        productCategories={productCategories}
        productTemplates={productTemplates}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProductAction(id);
      toast.success("Product removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove product");
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

function ProductDialog({
  item,
  productCategories,
  productTemplates,
  open,
  onOpenChange,
}: {
  item?: Product;
  productCategories: ProductCategoryRow[];
  productTemplates: ProductTemplateRow[];
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
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: item?.name ?? "",
      productCategoryId: item?.productCategoryId ?? "",
      productTemplateId: item?.productTemplateId ?? null,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? "",
        productCategoryId: item?.productCategoryId ?? "",
        productTemplateId: item?.productTemplateId ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const productCategoryId = watch("productCategoryId");
  const productTemplateId = watch("productTemplateId");

  async function onSubmit(values: ProductValues) {
    try {
      if (item) {
        await updateProductAction(item.id, values);
        toast.success("Product saved");
      } else {
        await createProductAction(values);
        toast.success("Product added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save product");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="prod-name">Name</FieldLabel>
              <Input id="prod-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="prod-category">Product category</FieldLabel>
              <Select
                value={productCategoryId}
                onValueChange={(value) =>
                  setValue("productCategoryId", value, { shouldDirty: true })
                }
              >
                <SelectTrigger id="prod-category">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.productCategoryId]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="prod-template">
                Product template (optional)
              </FieldLabel>
              <Select
                value={productTemplateId ?? NONE}
                onValueChange={(value) =>
                  setValue("productTemplateId", value === NONE ? null : value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="prod-template">
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
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
