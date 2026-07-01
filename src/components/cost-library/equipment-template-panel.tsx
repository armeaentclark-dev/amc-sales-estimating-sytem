"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
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
  createEquipmentTemplateAction,
  createEquipmentTemplateLineAction,
  deleteEquipmentTemplateAction,
  deleteEquipmentTemplateLineAction,
  updateEquipmentTemplateAction,
} from "@/lib/actions/cost-library-templates";
import type {
  equipment as equipmentTable,
  equipmentTemplateLines,
  equipmentTemplates,
} from "@/lib/db/schema";
import {
  equipmentTemplateLineSchema,
  equipmentTemplateSchema,
  type EquipmentTemplateLineValues,
  type EquipmentTemplateValues,
} from "@/lib/validations/cost-library-templates";

type EquipmentRow = typeof equipmentTable.$inferSelect;
type EquipmentTemplateLine = typeof equipmentTemplateLines.$inferSelect & {
  equipment: EquipmentRow;
};
type EquipmentTemplate = typeof equipmentTemplates.$inferSelect & {
  lines: EquipmentTemplateLine[];
};

interface EquipmentTemplatePanelProps {
  items: EquipmentTemplate[];
  equipment: EquipmentRow[];
}

export function EquipmentTemplatePanel({
  items,
  equipment,
}: EquipmentTemplatePanelProps) {
  const [editing, setEditing] = React.useState<
    EquipmentTemplate | "new" | null
  >(null);
  const [managingLines, setManagingLines] =
    React.useState<EquipmentTemplate | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add equipment template
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No equipment templates yet" />
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
                    <Clock />
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
      <EquipmentTemplateDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <EquipmentTemplateLinesDialog
        template={managingLines}
        equipment={equipment}
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
      await deleteEquipmentTemplateAction(id);
      toast.success("Equipment template removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove equipment template");
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

function EquipmentTemplateDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: EquipmentTemplate;
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
  } = useForm<EquipmentTemplateValues>({
    resolver: zodResolver(equipmentTemplateSchema),
    defaultValues: { name: item?.name ?? "", isActive: item?.isActive ?? true },
  });

  React.useEffect(() => {
    if (open)
      reset({ name: item?.name ?? "", isActive: item?.isActive ?? true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const isActive = watch("isActive");

  async function onSubmit(values: EquipmentTemplateValues) {
    try {
      if (item) {
        await updateEquipmentTemplateAction(item.id, values);
        toast.success("Equipment template saved");
      } else {
        await createEquipmentTemplateAction(values);
        toast.success("Equipment template added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save equipment template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit equipment template" : "Add equipment template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="et-name">Name</FieldLabel>
              <Input id="et-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="et-active"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked === true, { shouldDirty: true })
                }
              />
              <FieldLabel htmlFor="et-active">Active</FieldLabel>
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

function EquipmentTemplateLinesDialog({
  template,
  equipment,
  open,
  onOpenChange,
}: {
  template: EquipmentTemplate | null;
  equipment: EquipmentRow[];
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
  } = useForm<EquipmentTemplateLineValues>({
    resolver: zodResolver(equipmentTemplateLineSchema),
    defaultValues: { equipmentId: "", standardHours: "" },
  });

  React.useEffect(() => {
    if (open) reset({ equipmentId: "", standardHours: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  const equipmentId = watch("equipmentId");

  async function onSubmit(values: EquipmentTemplateLineValues) {
    if (!template) return;
    try {
      await createEquipmentTemplateLineAction(template.id, values);
      toast.success("Line added");
      router.refresh();
      reset({ equipmentId: "", standardHours: "" });
    } catch {
      toast.error("Failed to add line");
    }
  }

  async function handleDeleteLine(id: string) {
    try {
      await deleteEquipmentTemplateLineAction(id);
      toast.success("Line removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove line");
    }
  }

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lines — {template.name}</DialogTitle>
        </DialogHeader>
        {template.lines.length === 0 ? (
          <p className="text-muted-foreground text-sm">No lines yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Std hours</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.equipment.name}</TableCell>
                  <TableCell>{line.standardHours}</TableCell>
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
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="el-equipment">Equipment</FieldLabel>
                <Select
                  value={equipmentId}
                  onValueChange={(value) =>
                    setValue("equipmentId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="el-equipment">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.equipmentId]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="el-hours">Standard hours</FieldLabel>
                <Input
                  id="el-hours"
                  type="number"
                  step="0.0001"
                  {...register("standardHours")}
                />
                <FieldError errors={[errors.standardHours]} />
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
