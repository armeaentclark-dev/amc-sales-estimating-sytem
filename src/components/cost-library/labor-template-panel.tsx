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
  createLaborTemplateAction,
  createLaborTemplateLineAction,
  deleteLaborTemplateAction,
  deleteLaborTemplateLineAction,
  updateLaborTemplateAction,
} from "@/lib/actions/cost-library-templates";
import type {
  laborProcesses,
  laborTemplateLines,
  laborTemplates,
} from "@/lib/db/schema";
import {
  laborTemplateLineSchema,
  laborTemplateSchema,
  type LaborTemplateLineValues,
  type LaborTemplateValues,
} from "@/lib/validations/cost-library-templates";

type LaborProcessRow = typeof laborProcesses.$inferSelect;
type LaborTemplateLine = typeof laborTemplateLines.$inferSelect & {
  laborProcess: LaborProcessRow;
};
type LaborTemplate = typeof laborTemplates.$inferSelect & {
  lines: LaborTemplateLine[];
};

interface LaborTemplatePanelProps {
  items: LaborTemplate[];
  laborProcesses: LaborProcessRow[];
}

export function LaborTemplatePanel({
  items,
  laborProcesses,
}: LaborTemplatePanelProps) {
  const [editing, setEditing] = React.useState<LaborTemplate | "new" | null>(
    null,
  );
  const [managingLines, setManagingLines] =
    React.useState<LaborTemplate | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add labor template
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No labor templates yet" />
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
      <LaborTemplateDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <LaborTemplateLinesDialog
        template={managingLines}
        laborProcesses={laborProcesses}
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
      await deleteLaborTemplateAction(id);
      toast.success("Labor template removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove labor template");
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

function LaborTemplateDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: LaborTemplate;
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
  } = useForm<LaborTemplateValues>({
    resolver: zodResolver(laborTemplateSchema),
    defaultValues: { name: item?.name ?? "", isActive: item?.isActive ?? true },
  });

  React.useEffect(() => {
    if (open)
      reset({ name: item?.name ?? "", isActive: item?.isActive ?? true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const isActive = watch("isActive");

  async function onSubmit(values: LaborTemplateValues) {
    try {
      if (item) {
        await updateLaborTemplateAction(item.id, values);
        toast.success("Labor template saved");
      } else {
        await createLaborTemplateAction(values);
        toast.success("Labor template added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save labor template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit labor template" : "Add labor template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lt-name">Name</FieldLabel>
              <Input id="lt-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="lt-active"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked === true, { shouldDirty: true })
                }
              />
              <FieldLabel htmlFor="lt-active">Active</FieldLabel>
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

function LaborTemplateLinesDialog({
  template,
  laborProcesses,
  open,
  onOpenChange,
}: {
  template: LaborTemplate | null;
  laborProcesses: LaborProcessRow[];
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
  } = useForm<LaborTemplateLineValues>({
    resolver: zodResolver(laborTemplateLineSchema),
    defaultValues: { laborProcessId: "", standardHours: "" },
  });

  React.useEffect(() => {
    if (open) reset({ laborProcessId: "", standardHours: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  const laborProcessId = watch("laborProcessId");

  async function onSubmit(values: LaborTemplateLineValues) {
    if (!template) return;
    try {
      await createLaborTemplateLineAction(template.id, values);
      toast.success("Line added");
      router.refresh();
      reset({ laborProcessId: "", standardHours: "" });
    } catch {
      toast.error("Failed to add line");
    }
  }

  async function handleDeleteLine(id: string) {
    try {
      await deleteLaborTemplateLineAction(id);
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
                <TableHead>Labor process</TableHead>
                <TableHead>Std hours</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.laborProcess.name}</TableCell>
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
                <FieldLabel htmlFor="ll-process">Labor process</FieldLabel>
                <Select
                  value={laborProcessId}
                  onValueChange={(value) =>
                    setValue("laborProcessId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="ll-process">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {laborProcesses.map((process) => (
                      <SelectItem key={process.id} value={process.id}>
                        {process.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.laborProcessId]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ll-hours">Standard hours</FieldLabel>
                <Input
                  id="ll-hours"
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
