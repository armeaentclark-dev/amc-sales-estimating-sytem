"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createEstimateAction } from "@/lib/actions/estimates";
import type { customers, users } from "@/lib/db/schema";
import {
  estimateSchema,
  type EstimateValues,
} from "@/lib/validations/estimates";

interface EstimateFormProps {
  customers: (typeof customers.$inferSelect)[];
  salespeople: (typeof users.$inferSelect)[];
}

export function EstimateForm({ customers, salespeople }: EstimateFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EstimateValues>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      customerId: "",
      salespersonId: "",
      title: "",
      currency: "USD",
      validUntil: "",
    },
  });

  const customerId = watch("customerId");
  const salespersonId = watch("salespersonId");

  async function onSubmit(values: EstimateValues) {
    try {
      const estimate = await createEstimateAction(values);
      toast.success("Estimate created");
      if (estimate) router.push(`/estimates/${estimate.id}`);
    } catch {
      toast.error("Failed to create estimate");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>New estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="est-title">Title</FieldLabel>
              <Input
                id="est-title"
                placeholder="e.g. Q3 Bracket Order"
                {...register("title")}
              />
              <FieldError errors={[errors.title]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="est-customer">Customer</FieldLabel>
                <Select
                  value={customerId}
                  onValueChange={(value) =>
                    setValue("customerId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="est-customer">
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
              <Field>
                <FieldLabel htmlFor="est-salesperson">Salesperson</FieldLabel>
                <Select
                  value={salespersonId}
                  onValueChange={(value) =>
                    setValue("salespersonId", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="est-salesperson">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {salespeople.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.fullName ?? person.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.salespersonId]} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="est-currency">Currency</FieldLabel>
                <Input id="est-currency" {...register("currency")} />
                <FieldError errors={[errors.currency]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="est-valid-until">
                  Valid until (optional)
                </FieldLabel>
                <Input
                  id="est-valid-until"
                  type="date"
                  {...register("validUntil")}
                />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create estimate"}
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
