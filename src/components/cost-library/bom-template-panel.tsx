"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
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
  createBomTemplateAction,
  createBomTemplateLineAction,
  deleteBomTemplateAction,
  deleteBomTemplateLineAction,
  updateBomTemplateAction,
} from "@/lib/actions/cost-library-templates";
import type {
  bomTemplateLines,
  bomTemplates,
  materials,
  uoms,
} from "@/lib/db/schema";
import {
  bomTemplateLineSchema,
  bomTemplateSchema,
  type BomTemplateLineValues,
  type BomTemplateValues,
} from "@/lib/validations/cost-library-templates";

type MaterialRow = typeof materials.$inferSelect;
type UomRow = typeof uoms.$inferSelect;
type BomTemplateLine = typeof bomTemplateLines.$inferSelect & {
  material: MaterialRow;
  uom: UomRow;
};
type BomTemplate = typeof bomTemplates.$inferSelect & {
  lines: BomTemplateLine[];
};

interface BomTemplatePanelProps {
  items: BomTemplate[];
  materials: MaterialRow[];
  uoms: UomRow[];
}

export function BomTemplatePanel({
  items,
  materials,
  uoms,
}: BomTemplatePanelProps) {
  const [editing, setEditing] = React.useState<BomTemplate | "new" | null>(
    null,
  );
  const [managingLines, setManagingLines] = React.useState<BomTemplate | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add BOM template
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No BOM templates yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rev</TableHead>
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
                <TableCell>{item.revision}</TableCell>
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
                    <Layers />
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
      <BomTemplateDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <BomTemplateLinesDialog
        template={managingLines}
        materials={materials}
        uoms={uoms}
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
      await deleteBomTemplateAction(id);
      toast.success("BOM template removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove BOM template");
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

function BomTemplateDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: BomTemplate;
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
  } = useForm<BomTemplateValues>({
    resolver: zodResolver(bomTemplateSchema),
    defaultValues: {
      name: item?.name ?? "",
      revision: item?.revision ?? 1,
      isActive: item?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? "",
        revision: item?.revision ?? 1,
        isActive: item?.isActive ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const isActive = watch("isActive");

  async function onSubmit(values: BomTemplateValues) {
    try {
      if (item) {
        await updateBomTemplateAction(item.id, values);
        toast.success("BOM template saved");
      } else {
        await createBomTemplateAction(values);
        toast.success("BOM template added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save BOM template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit BOM template" : "Add BOM template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bom-name">Name</FieldLabel>
              <Input id="bom-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="bom-revision">Revision</FieldLabel>
              <Input
                id="bom-revision"
                type="number"
                min={1}
                {...register("revision", { valueAsNumber: true })}
              />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="bom-active"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked === true, { shouldDirty: true })
                }
              />
              <FieldLabel htmlFor="bom-active">Active</FieldLabel>
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

function BomTemplateLinesDialog({
  template,
  materials,
  uoms,
  open,
  onOpenChange,
}: {
  template: BomTemplate | null;
  materials: MaterialRow[];
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
  } = useForm<BomTemplateLineValues>({
    resolver: zodResolver(bomTemplateLineSchema),
    defaultValues: {
      materialId: "",
      quantity: "",
      uomId: "",
      scrapPercent: "0",
    },
  });

  React.useEffect(() => {
    if (open)
      reset({ materialId: "", quantity: "", uomId: "", scrapPercent: "0" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  const materialId = watch("materialId");
  const uomId = watch("uomId");

  async function onSubmit(values: BomTemplateLineValues) {
    if (!template) return;
    try {
      await createBomTemplateLineAction(template.id, values);
      toast.success("Line added");
      router.refresh();
      reset({ materialId: "", quantity: "", uomId: "", scrapPercent: "0" });
    } catch {
      toast.error("Failed to add line");
    }
  }

  async function handleDeleteLine(id: string) {
    try {
      await deleteBomTemplateLineAction(id);
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
                <TableHead>Material</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>Scrap %</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.material.name}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{line.uom.code}</TableCell>
                  <TableCell>{line.scrapPercent}</TableCell>
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
                <FieldLabel htmlFor="bl-material">Material</FieldLabel>
                <Select
                  value={materialId}
                  onValueChange={(value) =>
                    setValue("materialId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="bl-material">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.materialId]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="bl-uom">Unit of measure</FieldLabel>
                <Select
                  value={uomId}
                  onValueChange={(value) =>
                    setValue("uomId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="bl-uom">
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
                <FieldLabel htmlFor="bl-qty">Quantity</FieldLabel>
                <Input
                  id="bl-qty"
                  type="number"
                  step="0.0001"
                  {...register("quantity")}
                />
                <FieldError errors={[errors.quantity]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="bl-scrap">Scrap %</FieldLabel>
                <Input
                  id="bl-scrap"
                  type="number"
                  step="0.0001"
                  {...register("scrapPercent")}
                />
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
