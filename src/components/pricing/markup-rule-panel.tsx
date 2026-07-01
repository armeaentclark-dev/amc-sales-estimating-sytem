"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
  createMarkupRuleAction,
  deleteMarkupRuleAction,
} from "@/lib/actions/pricing";
import type {
  customers,
  markupRules,
  productCategories,
  productTemplates,
} from "@/lib/db/schema";
import {
  markupRateTypeValues,
  markupRuleSchema,
  markupScopeTypeValues,
  type MarkupRuleValues,
} from "@/lib/validations/pricing";

type MarkupRule = typeof markupRules.$inferSelect;
type ProductCategoryRow = typeof productCategories.$inferSelect;
type ProductTemplateRow = typeof productTemplates.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;

function scopeLabel(rule: MarkupRule, byId: Map<string, string>) {
  const name = byId.get(rule.scopeId) ?? "Unknown";
  const type =
    rule.scopeType === "product_category"
      ? "Category"
      : rule.scopeType === "product_template"
        ? "Template"
        : "Customer";
  return `${type}: ${name}`;
}

interface MarkupRulePanelProps {
  items: MarkupRule[];
  productCategories: ProductCategoryRow[];
  productTemplates: ProductTemplateRow[];
  customers: CustomerRow[];
}

export function MarkupRulePanel({
  items,
  productCategories,
  productTemplates,
  customers,
}: MarkupRulePanelProps) {
  const [open, setOpen] = React.useState(false);

  const byId = React.useMemo(() => {
    const map = new Map<string, string>();
    productCategories.forEach((c) => map.set(c.id, c.name));
    productTemplates.forEach((t) => map.set(t.id, t.name));
    customers.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [productCategories, productTemplates, customers]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Add markup rule
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No markup rules yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Badge variant="outline">{scopeLabel(rule, byId)}</Badge>
                </TableCell>
                <TableCell>
                  {rule.markupPercent
                    ? `${rule.markupPercent}% markup`
                    : `${rule.targetMarginPercent}% target margin`}
                </TableCell>
                <TableCell>{rule.effectiveDate}</TableCell>
                <TableCell>
                  <DeleteButton id={rule.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <MarkupRuleDialog
        productCategories={productCategories}
        productTemplates={productTemplates}
        customers={customers}
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
      await deleteMarkupRuleAction(id);
      toast.success("Markup rule removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove markup rule");
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

function MarkupRuleDialog({
  productCategories,
  productTemplates,
  customers,
  open,
  onOpenChange,
}: {
  productCategories: ProductCategoryRow[];
  productTemplates: ProductTemplateRow[];
  customers: CustomerRow[];
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
  } = useForm<MarkupRuleValues>({
    resolver: zodResolver(markupRuleSchema),
    defaultValues: {
      scopeType: "product_category",
      scopeId: "",
      rateType: "markup_percent",
      rateValue: "",
      effectiveDate: new Date().toISOString().slice(0, 10),
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        scopeType: "product_category",
        scopeId: "",
        rateType: "markup_percent",
        rateValue: "",
        effectiveDate: new Date().toISOString().slice(0, 10),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const scopeType = watch("scopeType");
  const scopeId = watch("scopeId");
  const rateType = watch("rateType");

  const scopeOptions =
    scopeType === "product_category"
      ? productCategories
      : scopeType === "product_template"
        ? productTemplates
        : customers;

  async function onSubmit(values: MarkupRuleValues) {
    try {
      await createMarkupRuleAction(values);
      toast.success("Markup rule added");
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save markup rule");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add markup rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="mr-scope-type">Scope type</FieldLabel>
                <Select
                  value={scopeType}
                  onValueChange={(value) => {
                    setValue(
                      "scopeType",
                      value as MarkupRuleValues["scopeType"],
                      {
                        shouldDirty: true,
                      },
                    );
                    setValue("scopeId", "", { shouldDirty: true });
                  }}
                >
                  <SelectTrigger id="mr-scope-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {markupScopeTypeValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value === "product_category"
                          ? "Product category"
                          : value === "product_template"
                            ? "Product template"
                            : "Customer"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="mr-scope">Scope</FieldLabel>
                <Select
                  value={scopeId}
                  onValueChange={(value) =>
                    setValue("scopeId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="mr-scope">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.scopeId]} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="mr-rate-type">Rate type</FieldLabel>
                <Select
                  value={rateType}
                  onValueChange={(value) =>
                    setValue(
                      "rateType",
                      value as MarkupRuleValues["rateType"],
                      {
                        shouldDirty: true,
                      },
                    )
                  }
                >
                  <SelectTrigger id="mr-rate-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {markupRateTypeValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value === "markup_percent"
                          ? "Markup %"
                          : "Target margin %"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="mr-rate-value">Value</FieldLabel>
                <Input
                  id="mr-rate-value"
                  type="number"
                  step="0.0001"
                  {...register("rateValue")}
                />
                <FieldError errors={[errors.rateValue]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="mr-effective">Effective date</FieldLabel>
              <Input
                id="mr-effective"
                type="date"
                {...register("effectiveDate")}
              />
              <FieldError errors={[errors.effectiveDate]} />
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
