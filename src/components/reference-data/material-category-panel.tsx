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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createMaterialCategoryAction,
  deleteMaterialCategoryAction,
  updateMaterialCategoryAction,
} from "@/lib/actions/reference-data";
import type { materialCategories } from "@/lib/db/schema";
import {
  materialCategorySchema,
  type MaterialCategoryValues,
} from "@/lib/validations/reference-data";

type MaterialCategory = typeof materialCategories.$inferSelect;

export function MaterialCategoryPanel({
  items,
}: {
  items: MaterialCategory[];
}) {
  const [editing, setEditing] = React.useState<MaterialCategory | "new" | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add material category
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No material categories yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Default unit cost</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  {item.defaultUnitCost !== null
                    ? `$${item.defaultUnitCost}`
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
      <MaterialCategoryDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
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
      await deleteMaterialCategoryAction(id);
      toast.success("Material category removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove material category");
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

function MaterialCategoryDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: MaterialCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaterialCategoryValues>({
    resolver: zodResolver(materialCategorySchema),
    defaultValues: {
      code: item?.code ?? "",
      name: item?.name ?? "",
      defaultUnitCost: item?.defaultUnitCost ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        code: item?.code ?? "",
        name: item?.name ?? "",
        defaultUnitCost: item?.defaultUnitCost ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  async function onSubmit(values: MaterialCategoryValues) {
    try {
      if (item) {
        await updateMaterialCategoryAction(item.id, values);
        toast.success("Material category saved");
      } else {
        await createMaterialCategoryAction(values);
        toast.success("Material category added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save material category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit material category" : "Add material category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mc-code">Code</FieldLabel>
              <Input
                id="mc-code"
                placeholder="e.g. CAT-STEEL"
                {...register("code")}
              />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="mc-name">Name</FieldLabel>
              <Input id="mc-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="mc-cost">
                Default unit cost (fallback pricing)
              </FieldLabel>
              <Input
                id="mc-cost"
                type="number"
                step="0.0001"
                {...register("defaultUnitCost")}
              />
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
