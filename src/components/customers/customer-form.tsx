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
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/actions/customers";
import {
  customerSchema,
  customerStatusValues,
  type CustomerValues,
} from "@/lib/validations/customer";

interface CustomerFormProps {
  customer?: {
    id: string;
    name: string;
    status: CustomerValues["status"];
    paymentTerms: string | null;
  };
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      status: customer?.status ?? "prospect",
      paymentTerms: customer?.paymentTerms ?? "",
    },
  });

  const status = watch("status");

  async function onSubmit(values: CustomerValues) {
    try {
      if (customer) {
        await updateCustomerAction(customer.id, values);
        toast.success("Customer saved");
        router.refresh();
      } else {
        const row = await createCustomerAction(values);
        toast.success("Customer created");
        if (row) router.push(`/customers/${row.id}`);
      }
    } catch {
      toast.error("Failed to save customer");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Customer profile</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Customer name</FieldLabel>
              <Input id="name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setValue("status", value as CustomerValues["status"], {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customerStatusValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="paymentTerms">Payment terms</FieldLabel>
                <Input
                  id="paymentTerms"
                  placeholder="e.g. Net 30"
                  {...register("paymentTerms")}
                />
              </Field>
            </div>

            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : customer
                    ? "Save changes"
                    : "Create customer"}
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
