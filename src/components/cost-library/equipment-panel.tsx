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
  createEquipmentAction,
  deleteEquipmentAction,
  updateEquipmentAction,
} from "@/lib/actions/cost-library";
import type {
  costCategories,
  equipment as equipmentTable,
} from "@/lib/db/schema";
import {
  equipmentSchema,
  type EquipmentValues,
} from "@/lib/validations/cost-library";

type CostCategoryRow = typeof costCategories.$inferSelect;

type Equipment = typeof equipmentTable.$inferSelect & {
  costCategory: CostCategoryRow;
};

interface EquipmentPanelProps {
  items: Equipment[];
  costCategories: CostCategoryRow[];
}

export function EquipmentPanel({ items, costCategories }: EquipmentPanelProps) {
  const [editing, setEditing] = React.useState<Equipment | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add equipment
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No equipment yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Cost category</TableHead>
              <TableHead>Rate / hour</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.equipmentNumber}
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.costCategory.name}</TableCell>
                <TableCell>${item.ratePerHour}</TableCell>
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
      <EquipmentDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
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
      await deleteEquipmentAction(id);
      toast.success("Equipment removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove equipment");
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

function EquipmentDialog({
  item,
  costCategories,
  open,
  onOpenChange,
}: {
  item?: Equipment;
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
  } = useForm<EquipmentValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: item?.name ?? "",
      costCategoryId: item?.costCategoryId ?? "",
      ratePerHour: item?.ratePerHour ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? "",
        costCategoryId: item?.costCategoryId ?? "",
        ratePerHour: item?.ratePerHour ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const costCategoryId = watch("costCategoryId");

  async function onSubmit(values: EquipmentValues) {
    try {
      if (item) {
        await updateEquipmentAction(item.id, values);
        toast.success("Equipment saved");
      } else {
        await createEquipmentAction(values);
        toast.success("Equipment added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save equipment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{item ? "Edit equipment" : "Add equipment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="eqp-name">Name</FieldLabel>
              <Input id="eqp-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="eqp-category">Cost category</FieldLabel>
              <Select
                value={costCategoryId}
                onValueChange={(value) =>
                  setValue("costCategoryId", value, { shouldDirty: true })
                }
              >
                <SelectTrigger id="eqp-category">
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
            <Field>
              <FieldLabel htmlFor="eqp-rate">Rate per hour</FieldLabel>
              <Input
                id="eqp-rate"
                type="number"
                step="0.0001"
                {...register("ratePerHour")}
              />
              <FieldError errors={[errors.ratePerHour]} />
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
