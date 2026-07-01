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
  createApprovalThresholdAction,
  deleteApprovalThresholdAction,
  updateApprovalThresholdAction,
} from "@/lib/actions/pricing";
import type { approvalThresholds, productCategories } from "@/lib/db/schema";
import {
  approvalThresholdSchema,
  type ApprovalThresholdValues,
} from "@/lib/validations/pricing";

const ALL_CATEGORIES = "__all__";

type ProductCategoryRow = typeof productCategories.$inferSelect;
type ApprovalThreshold = typeof approvalThresholds.$inferSelect & {
  productCategory: ProductCategoryRow | null;
};

interface ApprovalThresholdPanelProps {
  items: ApprovalThreshold[];
  productCategories: ProductCategoryRow[];
}

export function ApprovalThresholdPanel({
  items,
  productCategories,
}: ApprovalThresholdPanelProps) {
  const [editing, setEditing] = React.useState<
    ApprovalThreshold | "new" | null
  >(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add approval threshold
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No approval thresholds yet"
          description="Without one, no margin/value guardrails trigger required approval."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Margin floor</TableHead>
              <TableHead>Value ceiling</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {item.marginFloorPercent
                    ? `${item.marginFloorPercent}%`
                    : "—"}
                </TableCell>
                <TableCell>
                  {item.valueCeiling ? `$${item.valueCeiling}` : "—"}
                </TableCell>
                <TableCell>{item.productCategory?.name ?? "Global"}</TableCell>
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
      <ApprovalThresholdDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        productCategories={productCategories}
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
      await deleteApprovalThresholdAction(id);
      toast.success("Approval threshold removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove approval threshold");
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

function ApprovalThresholdDialog({
  item,
  productCategories,
  open,
  onOpenChange,
}: {
  item?: ApprovalThreshold;
  productCategories: ProductCategoryRow[];
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
  } = useForm<ApprovalThresholdValues>({
    resolver: zodResolver(approvalThresholdSchema),
    defaultValues: {
      name: item?.name ?? "",
      marginFloorPercent: item?.marginFloorPercent ?? "",
      valueCeiling: item?.valueCeiling ?? "",
      productCategoryId: item?.productCategoryId ?? null,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? "",
        marginFloorPercent: item?.marginFloorPercent ?? "",
        valueCeiling: item?.valueCeiling ?? "",
        productCategoryId: item?.productCategoryId ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const productCategoryId = watch("productCategoryId");

  async function onSubmit(values: ApprovalThresholdValues) {
    try {
      if (item) {
        await updateApprovalThresholdAction(item.id, values);
        toast.success("Approval threshold saved");
      } else {
        await createApprovalThresholdAction(values);
        toast.success("Approval threshold added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save approval threshold");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit approval threshold" : "Add approval threshold"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="at-name">Name</FieldLabel>
              <Input id="at-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="at-margin">
                Margin floor % (optional)
              </FieldLabel>
              <Input
                id="at-margin"
                type="number"
                step="0.0001"
                {...register("marginFloorPercent")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="at-ceiling">
                Value ceiling (optional)
              </FieldLabel>
              <Input
                id="at-ceiling"
                type="number"
                step="0.0001"
                {...register("valueCeiling")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="at-category">Scope (optional)</FieldLabel>
              <Select
                value={productCategoryId ?? ALL_CATEGORIES}
                onValueChange={(value) =>
                  setValue(
                    "productCategoryId",
                    value === ALL_CATEGORIES ? null : value,
                    { shouldDirty: true },
                  )
                }
              >
                <SelectTrigger id="at-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>Global</SelectItem>
                  {productCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
