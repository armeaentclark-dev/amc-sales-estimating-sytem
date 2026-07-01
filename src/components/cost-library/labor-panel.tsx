"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
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
  createLaborProcessAction,
  createLaborRateAction,
  deleteLaborProcessAction,
  deleteLaborRateAction,
  updateLaborProcessAction,
} from "@/lib/actions/cost-library";
import type {
  costCategories,
  laborProcesses,
  laborRates,
} from "@/lib/db/schema";
import {
  laborProcessSchema,
  laborRateSchema,
  type LaborProcessValues,
  type LaborRateValues,
} from "@/lib/validations/cost-library";

type CostCategoryRow = typeof costCategories.$inferSelect;
type LaborRate = typeof laborRates.$inferSelect;
type LaborProcess = typeof laborProcesses.$inferSelect & {
  costCategory: CostCategoryRow;
  laborRates: LaborRate[];
};

function currentRate(rates: LaborRate[]) {
  const today = new Date().toISOString().slice(0, 10);
  return rates.find(
    (rate) =>
      rate.effectiveDate <= today &&
      (!rate.expiresDate || rate.expiresDate > today),
  );
}

interface LaborPanelProps {
  items: LaborProcess[];
  costCategories: CostCategoryRow[];
}

export function LaborPanel({ items, costCategories }: LaborPanelProps) {
  const [editing, setEditing] = React.useState<LaborProcess | "new" | null>(
    null,
  );
  const [managingRates, setManagingRates] = React.useState<LaborProcess | null>(
    null,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add labor process
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No labor processes yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Cost category</TableHead>
              <TableHead>Current rate</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const rate = currentRate(item.laborRates);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.costCategory.name}</TableCell>
                  <TableCell>
                    {rate ? `$${rate.ratePerHour}/hr` : "—"}
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Manage rates"
                      onClick={() => setManagingRates(item)}
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
              );
            })}
          </TableBody>
        </Table>
      )}
      <LaborProcessDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        costCategories={costCategories}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      <LaborRatesDialog
        process={managingRates}
        open={managingRates !== null}
        onOpenChange={(open) => !open && setManagingRates(null)}
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
      await deleteLaborProcessAction(id);
      toast.success("Labor process removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove labor process");
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

function LaborProcessDialog({
  item,
  costCategories,
  open,
  onOpenChange,
}: {
  item?: LaborProcess;
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
  } = useForm<LaborProcessValues>({
    resolver: zodResolver(laborProcessSchema),
    defaultValues: {
      name: item?.name ?? "",
      costCategoryId: item?.costCategoryId ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: item?.name ?? "",
        costCategoryId: item?.costCategoryId ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const costCategoryId = watch("costCategoryId");

  async function onSubmit(values: LaborProcessValues) {
    try {
      if (item) {
        await updateLaborProcessAction(item.id, values);
        toast.success("Labor process saved");
      } else {
        await createLaborProcessAction(values);
        toast.success("Labor process added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save labor process");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit labor process" : "Add labor process"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lp-name">Name</FieldLabel>
              <Input
                id="lp-name"
                placeholder="e.g. Weld — MIG"
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="lp-category">Cost category</FieldLabel>
              <Select
                value={costCategoryId}
                onValueChange={(value) =>
                  setValue("costCategoryId", value, { shouldDirty: true })
                }
              >
                <SelectTrigger id="lp-category">
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

function LaborRatesDialog({
  process,
  open,
  onOpenChange,
}: {
  process: LaborProcess | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LaborRateValues>({
    resolver: zodResolver(laborRateSchema),
    defaultValues: {
      laborProcessId: process?.id ?? null,
      ratePerHour: "",
      effectiveDate: new Date().toISOString().slice(0, 10),
      expiresDate: "",
    },
  });

  React.useEffect(() => {
    if (open && process) {
      reset({
        laborProcessId: process.id,
        ratePerHour: "",
        effectiveDate: new Date().toISOString().slice(0, 10),
        expiresDate: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, process]);

  async function onSubmit(values: LaborRateValues) {
    try {
      await createLaborRateAction(values);
      toast.success("Rate added");
      router.refresh();
      reset({
        laborProcessId: process?.id ?? null,
        ratePerHour: "",
        effectiveDate: new Date().toISOString().slice(0, 10),
        expiresDate: "",
      });
    } catch {
      toast.error("Failed to add rate");
    }
  }

  async function handleDeleteRate(id: string) {
    try {
      await deleteLaborRateAction(id);
      toast.success("Rate removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove rate");
    }
  }

  if (!process) return null;

  const sortedRates = [...process.laborRates].sort((a, b) =>
    b.effectiveDate.localeCompare(a.effectiveDate),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rates — {process.name}</DialogTitle>
        </DialogHeader>
        {sortedRates.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No rates recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rate / hour</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>${rate.ratePerHour}</TableCell>
                  <TableCell>{rate.effectiveDate}</TableCell>
                  <TableCell>{rate.expiresDate ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDeleteRate(rate.id)}
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
                <FieldLabel htmlFor="rate-amount">Rate / hour</FieldLabel>
                <Input
                  id="rate-amount"
                  type="number"
                  step="0.0001"
                  {...register("ratePerHour")}
                />
                <FieldError errors={[errors.ratePerHour]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rate-effective">Effective</FieldLabel>
                <Input
                  id="rate-effective"
                  type="date"
                  {...register("effectiveDate")}
                />
                <FieldError errors={[errors.effectiveDate]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rate-expires">
                  Expires (optional)
                </FieldLabel>
                <Input
                  id="rate-expires"
                  type="date"
                  {...register("expiresDate")}
                />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting} size="sm">
                <Plus />
                {isSubmitting ? "Adding..." : "Add rate"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
