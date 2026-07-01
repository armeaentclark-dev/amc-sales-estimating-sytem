"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
  createTaxRuleAction,
  deleteTaxRuleAction,
} from "@/lib/actions/pricing";
import type { productCategories, taxRules } from "@/lib/db/schema";
import { taxRuleSchema, type TaxRuleValues } from "@/lib/validations/pricing";

const ALL_CATEGORIES = "__all__";

type ProductCategoryRow = typeof productCategories.$inferSelect;
type TaxRule = typeof taxRules.$inferSelect & {
  productCategory: ProductCategoryRow | null;
};

interface TaxRulePanelProps {
  items: TaxRule[];
  productCategories: ProductCategoryRow[];
}

export function TaxRulePanel({ items, productCategories }: TaxRulePanelProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Add tax rule
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No tax rules yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Product category</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">
                  {rule.jurisdiction}
                </TableCell>
                <TableCell>{rule.ratePercent}%</TableCell>
                <TableCell>
                  {rule.productCategory?.name ?? "All categories"}
                </TableCell>
                <TableCell>
                  <DeleteButton id={rule.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <TaxRuleDialog
        productCategories={productCategories}
        open={open}
        onOpenChange={setOpen}
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
      await deleteTaxRuleAction(id);
      toast.success("Tax rule removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove tax rule");
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

function TaxRuleDialog({
  productCategories,
  open,
  onOpenChange,
}: {
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
  } = useForm<TaxRuleValues>({
    resolver: zodResolver(taxRuleSchema),
    defaultValues: {
      jurisdiction: "",
      ratePercent: "",
      productCategoryId: null,
    },
  });

  React.useEffect(() => {
    if (open)
      reset({ jurisdiction: "", ratePercent: "", productCategoryId: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const productCategoryId = watch("productCategoryId");

  async function onSubmit(values: TaxRuleValues) {
    try {
      await createTaxRuleAction(values);
      toast.success("Tax rule added");
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save tax rule");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add tax rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tr-jurisdiction">Jurisdiction</FieldLabel>
              <Input
                id="tr-jurisdiction"
                placeholder="e.g. IL, CA"
                {...register("jurisdiction")}
              />
              <FieldError errors={[errors.jurisdiction]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="tr-rate">Rate %</FieldLabel>
              <Input
                id="tr-rate"
                type="number"
                step="0.0001"
                {...register("ratePercent")}
              />
              <FieldError errors={[errors.ratePercent]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="tr-category">
                Product category (optional)
              </FieldLabel>
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
                <SelectTrigger id="tr-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
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
              {isSubmitting ? "Saving..." : "Add rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
