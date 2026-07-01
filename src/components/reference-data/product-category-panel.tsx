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
  createProductCategoryAction,
  deleteProductCategoryAction,
  updateProductCategoryAction,
} from "@/lib/actions/reference-data";
import type { productCategories } from "@/lib/db/schema";
import {
  productCategorySchema,
  type ProductCategoryValues,
} from "@/lib/validations/reference-data";

type ProductCategory = typeof productCategories.$inferSelect;

const NO_PARENT = "__none__";

export function ProductCategoryPanel({ items }: { items: ProductCategory[] }) {
  const [editing, setEditing] = React.useState<ProductCategory | "new" | null>(
    null,
  );

  const byId = React.useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add product category
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No product categories yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  {item.parentCategoryId
                    ? (byId.get(item.parentCategoryId)?.name ?? "—")
                    : "—"}
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
      <ProductCategoryDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        allItems={items}
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
      await deleteProductCategoryAction(id);
      toast.success("Product category removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove product category");
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

function ProductCategoryDialog({
  item,
  allItems,
  open,
  onOpenChange,
}: {
  item?: ProductCategory;
  allItems: ProductCategory[];
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
  } = useForm<ProductCategoryValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      code: item?.code ?? "",
      name: item?.name ?? "",
      parentCategoryId: item?.parentCategoryId ?? null,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        code: item?.code ?? "",
        name: item?.name ?? "",
        parentCategoryId: item?.parentCategoryId ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const parentCategoryId = watch("parentCategoryId");
  const parentOptions = allItems.filter(
    (candidate) => candidate.id !== item?.id,
  );

  async function onSubmit(values: ProductCategoryValues) {
    try {
      if (item) {
        await updateProductCategoryAction(item.id, values);
        toast.success("Product category saved");
      } else {
        await createProductCategoryAction(values);
        toast.success("Product category added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save product category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit product category" : "Add product category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pc-code">Code</FieldLabel>
              <Input
                id="pc-code"
                placeholder="e.g. CAT-WELD"
                {...register("code")}
              />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pc-name">Name</FieldLabel>
              <Input id="pc-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pc-parent">Parent category</FieldLabel>
              <Select
                value={parentCategoryId ?? NO_PARENT}
                onValueChange={(value) =>
                  setValue(
                    "parentCategoryId",
                    value === NO_PARENT ? null : value,
                    { shouldDirty: true },
                  )
                }
              >
                <SelectTrigger id="pc-parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>None (top-level)</SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
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
