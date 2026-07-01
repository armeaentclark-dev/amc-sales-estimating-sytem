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
  createCustomerPricingAgreementAction,
  deleteCustomerPricingAgreementAction,
} from "@/lib/actions/pricing";
import type {
  customerPricingAgreements,
  customers,
  laborProcesses,
  materials,
} from "@/lib/db/schema";
import {
  customerPricingAgreementSchema,
  pricingAgreementScopeTypeValues,
  type CustomerPricingAgreementValues,
} from "@/lib/validations/pricing";

type CustomerRow = typeof customers.$inferSelect;
type MaterialRow = typeof materials.$inferSelect;
type LaborProcessRow = typeof laborProcesses.$inferSelect;
type Agreement = typeof customerPricingAgreements.$inferSelect & {
  customer: CustomerRow;
};

interface CustomerPricingAgreementPanelProps {
  items: Agreement[];
  customers: CustomerRow[];
  materials: MaterialRow[];
  laborProcesses: LaborProcessRow[];
}

export function CustomerPricingAgreementPanel({
  items,
  customers,
  materials,
  laborProcesses,
}: CustomerPricingAgreementPanelProps) {
  const [open, setOpen] = React.useState(false);

  const scopeById = React.useMemo(() => {
    const map = new Map<string, string>();
    materials.forEach((m) => map.set(m.id, m.name));
    laborProcesses.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [materials, laborProcesses]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Add pricing agreement
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No customer pricing agreements yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Negotiated rate</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell>{agreement.customer.name}</TableCell>
                <TableCell>
                  {agreement.scopeType === "material" ? "Material" : "Labor"}:{" "}
                  {scopeById.get(agreement.scopeId) ?? "Unknown"}
                </TableCell>
                <TableCell>${agreement.negotiatedRate}</TableCell>
                <TableCell>{agreement.effectiveDate}</TableCell>
                <TableCell>
                  <DeleteButton id={agreement.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <AgreementDialog
        customers={customers}
        materials={materials}
        laborProcesses={laborProcesses}
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
      await deleteCustomerPricingAgreementAction(id);
      toast.success("Pricing agreement removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove pricing agreement");
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

function AgreementDialog({
  customers,
  materials,
  laborProcesses,
  open,
  onOpenChange,
}: {
  customers: CustomerRow[];
  materials: MaterialRow[];
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
  } = useForm<CustomerPricingAgreementValues>({
    resolver: zodResolver(customerPricingAgreementSchema),
    defaultValues: {
      customerId: "",
      scopeType: "material",
      scopeId: "",
      negotiatedRate: "",
      effectiveDate: new Date().toISOString().slice(0, 10),
      expiresDate: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        customerId: "",
        scopeType: "material",
        scopeId: "",
        negotiatedRate: "",
        effectiveDate: new Date().toISOString().slice(0, 10),
        expiresDate: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const customerId = watch("customerId");
  const scopeType = watch("scopeType");
  const scopeId = watch("scopeId");
  const scopeOptions = scopeType === "material" ? materials : laborProcesses;

  async function onSubmit(values: CustomerPricingAgreementValues) {
    try {
      await createCustomerPricingAgreementAction(values);
      toast.success("Pricing agreement added");
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save pricing agreement");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add customer pricing agreement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cpa-customer">Customer</FieldLabel>
              <Select
                value={customerId}
                onValueChange={(value) =>
                  setValue("customerId", value, { shouldDirty: true })
                }
              >
                <SelectTrigger id="cpa-customer">
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
              <FieldError errors={[errors.customerId]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="cpa-scope-type">Scope type</FieldLabel>
                <Select
                  value={scopeType}
                  onValueChange={(value) => {
                    setValue(
                      "scopeType",
                      value as CustomerPricingAgreementValues["scopeType"],
                      { shouldDirty: true },
                    );
                    setValue("scopeId", "", { shouldDirty: true });
                  }}
                >
                  <SelectTrigger id="cpa-scope-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingAgreementScopeTypeValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value === "material" ? "Material" : "Labor process"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="cpa-scope">
                  {scopeType === "material" ? "Material" : "Labor process"}
                </FieldLabel>
                <Select
                  value={scopeId}
                  onValueChange={(value) =>
                    setValue("scopeId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="cpa-scope">
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
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="cpa-rate">Negotiated rate</FieldLabel>
                <Input
                  id="cpa-rate"
                  type="number"
                  step="0.0001"
                  {...register("negotiatedRate")}
                />
                <FieldError errors={[errors.negotiatedRate]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="cpa-effective">Effective</FieldLabel>
                <Input
                  id="cpa-effective"
                  type="date"
                  {...register("effectiveDate")}
                />
                <FieldError errors={[errors.effectiveDate]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="cpa-expires">
                  Expires (optional)
                </FieldLabel>
                <Input
                  id="cpa-expires"
                  type="date"
                  {...register("expiresDate")}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add agreement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
