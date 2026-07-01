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
  createMaterialAction,
  deleteMaterialAction,
  updateMaterialAction,
} from "@/lib/actions/cost-library";
import type {
  costCategories,
  materialCategories,
  materials,
  uoms,
} from "@/lib/db/schema";
import {
  materialSchema,
  type MaterialValues,
} from "@/lib/validations/cost-library";

type MaterialCategoryRow = typeof materialCategories.$inferSelect;
type UomRow = typeof uoms.$inferSelect;
type CostCategoryRow = typeof costCategories.$inferSelect;

type Material = typeof materials.$inferSelect & {
  materialCategory: MaterialCategoryRow;
  uom: UomRow;
  costCategory: CostCategoryRow;
};

interface MaterialPanelProps {
  items: Material[];
  materialCategories: MaterialCategoryRow[];
  uoms: UomRow[];
  costCategories: CostCategoryRow[];
}

export function MaterialPanel({
  items,
  materialCategories,
  uoms,
  costCategories,
}: MaterialPanelProps) {
  const [editing, setEditing] = React.useState<Material | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add material
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No materials yet"
          description={
            materialCategories.length === 0 || uoms.length === 0
              ? "Add at least one material category and unit of measure first (Settings > Reference Data)."
              : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Unit cost</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.materialNumber}
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.materialCategory.name}</TableCell>
                <TableCell>{item.uom.code}</TableCell>
                <TableCell>${item.currentUnitCost}</TableCell>
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
      <MaterialDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        materialCategories={materialCategories}
        uoms={uoms}
        costCategories={costCategories}
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
      await deleteMaterialAction(id);
      toast.success("Material removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove material");
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

function MaterialDialog({
  item,
  materialCategories,
  uoms,
  costCategories,
  open,
  onOpenChange,
}: {
  item?: Material;
  materialCategories: MaterialCategoryRow[];
  uoms: UomRow[];
  costCategories: CostCategoryRow[];
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
  } = useForm<MaterialValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: item?.name ?? "",
      materialCategoryId: item?.materialCategoryId ?? "",
      uomId: item?.uomId ?? "",
      currentUnitCost: item?.currentUnitCost ?? "",
      costCategoryId: item?.costCategoryId ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? "",
        materialCategoryId: item?.materialCategoryId ?? "",
        uomId: item?.uomId ?? "",
        currentUnitCost: item?.currentUnitCost ?? "",
        costCategoryId: item?.costCategoryId ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const materialCategoryId = watch("materialCategoryId");
  const uomId = watch("uomId");
  const costCategoryId = watch("costCategoryId");

  async function onSubmit(values: MaterialValues) {
    try {
      if (item) {
        await updateMaterialAction(item.id, values);
        toast.success("Material saved");
      } else {
        await createMaterialAction(values);
        toast.success("Material added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save material");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit material" : "Add material"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mat-name">Name</FieldLabel>
              <Input id="mat-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="mat-category">
                  Material category
                </FieldLabel>
                <Select
                  value={materialCategoryId}
                  onValueChange={(value) =>
                    setValue("materialCategoryId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="mat-category">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materialCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.materialCategoryId]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="mat-uom">Unit of measure</FieldLabel>
                <Select
                  value={uomId}
                  onValueChange={(value) =>
                    setValue("uomId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="mat-uom">
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
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="mat-cost">Current unit cost</FieldLabel>
                <Input
                  id="mat-cost"
                  type="number"
                  step="0.0001"
                  {...register("currentUnitCost")}
                />
                <FieldError errors={[errors.currentUnitCost]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="mat-cost-category">
                  Cost category
                </FieldLabel>
                <Select
                  value={costCategoryId}
                  onValueChange={(value) =>
                    setValue("costCategoryId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="mat-cost-category">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {costCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.costCategoryId]} />
              </Field>
            </div>
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
