"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
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
  createCostCategoryAction,
  deleteCostCategoryAction,
  updateCostCategoryAction,
} from "@/lib/actions/reference-data";
import type { costCategories } from "@/lib/db/schema";
import {
  costCategorySchema,
  costTypeValues,
  type CostCategoryValues,
} from "@/lib/validations/reference-data";

type CostCategory = typeof costCategories.$inferSelect;

export function CostCategoryPanel({ items }: { items: CostCategory[] }) {
  const [editing, setEditing] = React.useState<CostCategory | "new" | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add cost category
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No cost categories yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Cost type</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {item.costType}
                  </Badge>
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
      <CostCategoryDialog
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
      await deleteCostCategoryAction(id);
      toast.success("Cost category removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove cost category");
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

function CostCategoryDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: CostCategory;
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
  } = useForm<CostCategoryValues>({
    resolver: zodResolver(costCategorySchema),
    defaultValues: {
      code: item?.code ?? "",
      name: item?.name ?? "",
      costType: item?.costType ?? "material",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        code: item?.code ?? "",
        name: item?.name ?? "",
        costType: item?.costType ?? "material",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const costType = watch("costType");

  async function onSubmit(values: CostCategoryValues) {
    try {
      if (item) {
        await updateCostCategoryAction(item.id, values);
        toast.success("Cost category saved");
      } else {
        await createCostCategoryAction(values);
        toast.success("Cost category added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save cost category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit cost category" : "Add cost category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cc-code">Code</FieldLabel>
              <Input
                id="cc-code"
                placeholder="e.g. CAT-STEEL"
                {...register("code")}
              />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="cc-name">Name</FieldLabel>
              <Input id="cc-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="cc-type">Cost type</FieldLabel>
              <Select
                value={costType}
                onValueChange={(value) =>
                  setValue(
                    "costType",
                    value as CostCategoryValues["costType"],
                    {
                      shouldDirty: true,
                    },
                  )
                }
              >
                <SelectTrigger id="cc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
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
