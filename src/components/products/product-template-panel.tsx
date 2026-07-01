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
  createProductTemplateAction,
  deleteProductTemplateAction,
  updateProductTemplateAction,
} from "@/lib/actions/products";
import type {
  bomTemplates,
  equipmentTemplates,
  laborTemplates,
  overheadTemplates,
  productCategories,
  productTemplates,
} from "@/lib/db/schema";
import {
  productTemplateSchema,
  type ProductTemplateValues,
} from "@/lib/validations/products";

const NONE = "__none__";

type ProductCategoryRow = typeof productCategories.$inferSelect;
type BomTemplateRow = typeof bomTemplates.$inferSelect;
type LaborTemplateRow = typeof laborTemplates.$inferSelect;
type EquipmentTemplateRow = typeof equipmentTemplates.$inferSelect;
type OverheadTemplateRow = typeof overheadTemplates.$inferSelect;

type ProductTemplate = typeof productTemplates.$inferSelect & {
  productCategory: ProductCategoryRow;
  bomTemplate: BomTemplateRow | null;
  laborTemplate: LaborTemplateRow | null;
  equipmentTemplate: EquipmentTemplateRow | null;
  overheadTemplate: OverheadTemplateRow | null;
};

interface ProductTemplatePanelProps {
  items: ProductTemplate[];
  productCategories: ProductCategoryRow[];
  bomTemplates: BomTemplateRow[];
  laborTemplates: LaborTemplateRow[];
  equipmentTemplates: EquipmentTemplateRow[];
  overheadTemplates: OverheadTemplateRow[];
}

export function ProductTemplatePanel({
  items,
  productCategories,
  bomTemplates,
  laborTemplates,
  equipmentTemplates,
  overheadTemplates,
}: ProductTemplatePanelProps) {
  const [editing, setEditing] = React.useState<ProductTemplate | "new" | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add product template
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No product templates yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>BOM</TableHead>
              <TableHead>Labor</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Overhead</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.templateNumber}
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.productCategory.name}</TableCell>
                <TableCell>{item.bomTemplate?.templateNumber ?? "—"}</TableCell>
                <TableCell>
                  {item.laborTemplate?.templateNumber ?? "—"}
                </TableCell>
                <TableCell>
                  {item.equipmentTemplate?.templateNumber ?? "—"}
                </TableCell>
                <TableCell>
                  {item.overheadTemplate?.templateNumber ?? "—"}
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
      <ProductTemplateDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        productCategories={productCategories}
        bomTemplates={bomTemplates}
        laborTemplates={laborTemplates}
        equipmentTemplates={equipmentTemplates}
        overheadTemplates={overheadTemplates}
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
      await deleteProductTemplateAction(id);
      toast.success("Product template removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove product template");
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

function ProductTemplateDialog({
  item,
  productCategories,
  bomTemplates,
  laborTemplates,
  equipmentTemplates,
  overheadTemplates,
  open,
  onOpenChange,
}: {
  item?: ProductTemplate;
  productCategories: ProductCategoryRow[];
  bomTemplates: BomTemplateRow[];
  laborTemplates: LaborTemplateRow[];
  equipmentTemplates: EquipmentTemplateRow[];
  overheadTemplates: OverheadTemplateRow[];
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
  } = useForm<ProductTemplateValues>({
    resolver: zodResolver(productTemplateSchema),
    defaultValues: {
      name: item?.name ?? "",
      productCategoryId: item?.productCategoryId ?? "",
      bomTemplateId: item?.bomTemplateId ?? null,
      laborTemplateId: item?.laborTemplateId ?? null,
      equipmentTemplateId: item?.equipmentTemplateId ?? null,
      overheadTemplateId: item?.overheadTemplateId ?? null,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? "",
        productCategoryId: item?.productCategoryId ?? "",
        bomTemplateId: item?.bomTemplateId ?? null,
        laborTemplateId: item?.laborTemplateId ?? null,
        equipmentTemplateId: item?.equipmentTemplateId ?? null,
        overheadTemplateId: item?.overheadTemplateId ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const productCategoryId = watch("productCategoryId");
  const bomTemplateId = watch("bomTemplateId");
  const laborTemplateId = watch("laborTemplateId");
  const equipmentTemplateId = watch("equipmentTemplateId");
  const overheadTemplateId = watch("overheadTemplateId");

  async function onSubmit(values: ProductTemplateValues) {
    try {
      if (item) {
        await updateProductTemplateAction(item.id, values);
        toast.success("Product template saved");
      } else {
        await createProductTemplateAction(values);
        toast.success("Product template added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save product template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit product template" : "Add product template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="pt-name">Name</FieldLabel>
                <Input id="pt-name" {...register("name")} />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="pt-category">Product category</FieldLabel>
                <Select
                  value={productCategoryId}
                  onValueChange={(value) =>
                    setValue("productCategoryId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="pt-category">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="pt-bom">BOM template</FieldLabel>
                <Select
                  value={bomTemplateId ?? NONE}
                  onValueChange={(value) =>
                    setValue("bomTemplateId", value === NONE ? null : value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="pt-bom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {bomTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="pt-labor">Labor template</FieldLabel>
                <Select
                  value={laborTemplateId ?? NONE}
                  onValueChange={(value) =>
                    setValue("laborTemplateId", value === NONE ? null : value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="pt-labor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {laborTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="pt-equipment">
                  Equipment template
                </FieldLabel>
                <Select
                  value={equipmentTemplateId ?? NONE}
                  onValueChange={(value) =>
                    setValue(
                      "equipmentTemplateId",
                      value === NONE ? null : value,
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger id="pt-equipment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {equipmentTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="pt-overhead">Overhead template</FieldLabel>
                <Select
                  value={overheadTemplateId ?? NONE}
                  onValueChange={(value) =>
                    setValue(
                      "overheadTemplateId",
                      value === NONE ? null : value,
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger id="pt-overhead">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {overheadTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
