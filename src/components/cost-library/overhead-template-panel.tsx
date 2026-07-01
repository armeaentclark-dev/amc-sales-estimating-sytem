"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Percent, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  createOverheadTemplateAction,
  createOverheadTemplateLineAction,
  deleteOverheadTemplateAction,
  deleteOverheadTemplateLineAction,
  updateOverheadTemplateAction,
} from "@/lib/actions/cost-library-templates";
import type {
  costCategories,
  overheadTemplateLines,
  overheadTemplates,
} from "@/lib/db/schema";
import {
  overheadAllocationMethodValues,
  overheadTemplateLineSchema,
  overheadTemplateSchema,
  type OverheadTemplateLineValues,
  type OverheadTemplateValues,
} from "@/lib/validations/cost-library-templates";

type CostCategoryRow = typeof costCategories.$inferSelect;
type OverheadTemplateLine = typeof overheadTemplateLines.$inferSelect & {
  costCategory: CostCategoryRow;
};
type OverheadTemplate = typeof overheadTemplates.$inferSelect & {
  lines: OverheadTemplateLine[];
};

function methodLabel(method: string) {
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface OverheadTemplatePanelProps {
  items: OverheadTemplate[];
  costCategories: CostCategoryRow[];
}

export function OverheadTemplatePanel({
  items,
  costCategories,
}: OverheadTemplatePanelProps) {
  const [editing, setEditing] = React.useState<OverheadTemplate | "new" | null>(
    null,
  );
  const [managingLines, setManagingLines] =
    React.useState<OverheadTemplate | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add overhead template
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No overhead templates yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.templateNumber}
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{item.lines.length}</TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Manage lines"
                    onClick={() => setManagingLines(item)}
                  >
                    <Percent />
                  </Button>
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
      <OverheadTemplateDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <OverheadTemplateLinesDialog
        template={managingLines}
        costCategories={costCategories}
        open={managingLines !== null}
        onOpenChange={(open) => !open && setManagingLines(null)}
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
      await deleteOverheadTemplateAction(id);
      toast.success("Overhead template removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove overhead template");
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

function OverheadTemplateDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: OverheadTemplate;
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
  } = useForm<OverheadTemplateValues>({
    resolver: zodResolver(overheadTemplateSchema),
    defaultValues: { name: item?.name ?? "", isActive: item?.isActive ?? true },
  });

  React.useEffect(() => {
    if (open)
      reset({ name: item?.name ?? "", isActive: item?.isActive ?? true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const isActive = watch("isActive");

  async function onSubmit(values: OverheadTemplateValues) {
    try {
      if (item) {
        await updateOverheadTemplateAction(item.id, values);
        toast.success("Overhead template saved");
      } else {
        await createOverheadTemplateAction(values);
        toast.success("Overhead template added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save overhead template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit overhead template" : "Add overhead template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="oh-name">Name</FieldLabel>
              <Input id="oh-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="oh-active"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked === true, { shouldDirty: true })
                }
              />
              <FieldLabel htmlFor="oh-active">Active</FieldLabel>
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

function OverheadTemplateLinesDialog({
  template,
  costCategories,
  open,
  onOpenChange,
}: {
  template: OverheadTemplate | null;
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
  } = useForm<OverheadTemplateLineValues>({
    resolver: zodResolver(overheadTemplateLineSchema),
    defaultValues: {
      costCategoryId: "",
      allocationMethod: "percent_of_labor",
      rate: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        costCategoryId: "",
        allocationMethod: "percent_of_labor",
        rate: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  const costCategoryId = watch("costCategoryId");
  const allocationMethod = watch("allocationMethod");

  async function onSubmit(values: OverheadTemplateLineValues) {
    if (!template) return;
    try {
      await createOverheadTemplateLineAction(template.id, values);
      toast.success("Line added");
      router.refresh();
      reset({
        costCategoryId: "",
        allocationMethod: "percent_of_labor",
        rate: "",
      });
    } catch {
      toast.error("Failed to add line");
    }
  }

  async function handleDeleteLine(id: string) {
    try {
      await deleteOverheadTemplateLineAction(id);
      toast.success("Line removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove line");
    }
  }

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lines — {template.name}</DialogTitle>
        </DialogHeader>
        {template.lines.length === 0 ? (
          <p className="text-muted-foreground text-sm">No lines yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost category</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.costCategory.name}</TableCell>
                  <TableCell>{methodLabel(line.allocationMethod)}</TableCell>
                  <TableCell>{line.rate}</TableCell>
                  <TableCell>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDeleteLine(line.id)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="border-t pt-4"
        >
          <FieldGroup>
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="ol-category">Cost category</FieldLabel>
                <Select
                  value={costCategoryId}
                  onValueChange={(value) =>
                    setValue("costCategoryId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="ol-category">
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
                <FieldLabel htmlFor="ol-method">Method</FieldLabel>
                <Select
                  value={allocationMethod}
                  onValueChange={(value) =>
                    setValue(
                      "allocationMethod",
                      value as OverheadTemplateLineValues["allocationMethod"],
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger id="ol-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {overheadAllocationMethodValues.map((method) => (
                      <SelectItem key={method} value={method}>
                        {methodLabel(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="ol-rate">Rate</FieldLabel>
                <Input
                  id="ol-rate"
                  type="number"
                  step="0.0001"
                  {...register("rate")}
                />
                <FieldError errors={[errors.rate]} />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting} size="sm">
                <Plus />
                {isSubmitting ? "Adding..." : "Add line"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
