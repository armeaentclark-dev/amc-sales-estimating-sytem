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
  DialogDescription,
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
  createDiscountRuleAction,
  deleteDiscountRuleAction,
} from "@/lib/actions/pricing";
import type { customers, discountRules } from "@/lib/db/schema";
import {
  discountRateTypeValues,
  discountRuleSchema,
  type DiscountRuleValues,
} from "@/lib/validations/pricing";

type DiscountRule = typeof discountRules.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;

interface DiscountRulePanelProps {
  items: DiscountRule[];
  customers: CustomerRow[];
}

export function DiscountRulePanel({
  items,
  customers,
}: DiscountRulePanelProps) {
  const [open, setOpen] = React.useState(false);

  const customerById = React.useMemo(
    () => new Map(customers.map((c) => [c.id, c.name])),
    [customers],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Add discount rule
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No discount rules yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min qty</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  {customerById.get(rule.scopeId) ?? "Unknown"}
                </TableCell>
                <TableCell>
                  {rule.discountPercent
                    ? `${rule.discountPercent}%`
                    : `$${rule.discountAmount}`}
                </TableCell>
                <TableCell>{rule.minQuantity ?? "—"}</TableCell>
                <TableCell>
                  <DeleteButton id={rule.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <DiscountRuleDialog
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
      await deleteDiscountRuleAction(id);
      toast.success("Discount rule removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove discount rule");
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

function DiscountRuleDialog({
  customers,
  open,
  onOpenChange,
}: {
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
  } = useForm<DiscountRuleValues>({
    resolver: zodResolver(discountRuleSchema),
    defaultValues: {
      scopeType: "customer",
      scopeId: "",
      rateType: "discount_percent",
      rateValue: "",
      minQuantity: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        scopeType: "customer",
        scopeId: "",
        rateType: "discount_percent",
        rateValue: "",
        minQuantity: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const scopeId = watch("scopeId");
  const rateType = watch("rateType");

  async function onSubmit(values: DiscountRuleValues) {
    try {
      await createDiscountRuleAction(values);
      toast.success("Discount rule added");
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save discount rule");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add discount rule</DialogTitle>
          <DialogDescription>
            Estimate-scoped discounts will be supported once the Estimate
            Builder ships — customer-scoped discounts only for now.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dr-customer">Customer</FieldLabel>
              <Select
                value={scopeId}
                onValueChange={(value) =>
                  setValue("scopeId", value, { shouldDirty: true })
                }
              >
                <SelectTrigger id="dr-customer">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.scopeId]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="dr-rate-type">Type</FieldLabel>
                <Select
                  value={rateType}
                  onValueChange={(value) =>
                    setValue(
                      "rateType",
                      value as DiscountRuleValues["rateType"],
                      {
                        shouldDirty: true,
                      },
                    )
                  }
                >
                  <SelectTrigger id="dr-rate-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountRateTypeValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value === "discount_percent"
                          ? "Percent"
                          : "Flat amount"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="dr-rate-value">Value</FieldLabel>
                <Input
                  id="dr-rate-value"
                  type="number"
                  step="0.0001"
                  {...register("rateValue")}
                />
                <FieldError errors={[errors.rateValue]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="dr-min-qty">
                Minimum quantity (optional)
              </FieldLabel>
              <Input
                id="dr-min-qty"
                type="number"
                step="0.0001"
                {...register("minQuantity")}
              />
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
