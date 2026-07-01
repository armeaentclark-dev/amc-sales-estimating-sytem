"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  createAddressAction,
  deleteAddressAction,
  updateAddressAction,
} from "@/lib/actions/customers";
import type { addresses } from "@/lib/db/schema";
import {
  addressSchema,
  addressTypeValues,
  type AddressValues,
} from "@/lib/validations/customer";

type Address = typeof addresses.$inferSelect;

interface AddressesSectionProps {
  customerId: string;
  addresses: Address[];
}

export function AddressesSection({
  customerId,
  addresses,
}: AddressesSectionProps) {
  const [editing, setEditing] = React.useState<Address | "new" | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Addresses</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
          <Plus />
          Add address
        </Button>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <EmptyState
            title="No addresses yet"
            description="Add a billing or shipping address for this customer."
          />
        ) : (
          <ul className="divide-y">
            {addresses.map((address) => (
              <li
                key={address.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {address.type}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                    {address.state} {address.postalCode}, {address.country}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setEditing(address)}
                  >
                    <Pencil />
                  </Button>
                  <DeleteAddressButton
                    addressId={address.id}
                    customerId={customerId}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AddressDialog
        customerId={customerId}
        address={editing === "new" ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </Card>
  );
}

function DeleteAddressButton({
  addressId,
  customerId,
}: {
  addressId: string;
  customerId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAddressAction(addressId, customerId);
      toast.success("Address removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove address");
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

interface AddressDialogProps {
  customerId: string;
  address?: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddressDialog({
  customerId,
  address,
  open,
  onOpenChange,
}: AddressDialogProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: address?.type ?? "billing",
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "US",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        type: address?.type ?? "billing",
        line1: address?.line1 ?? "",
        line2: address?.line2 ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
        postalCode: address?.postalCode ?? "",
        country: address?.country ?? "US",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address]);

  const type = watch("type");

  async function onSubmit(values: AddressValues) {
    try {
      if (address) {
        await updateAddressAction(address.id, customerId, values);
        toast.success("Address saved");
      } else {
        await createAddressAction(customerId, values);
        toast.success("Address added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save address");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{address ? "Edit address" : "Add address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="address-type">Type</FieldLabel>
              <Select
                value={type}
                onValueChange={(value) =>
                  setValue("type", value as AddressValues["type"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="address-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {addressTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="address-line1">Address line 1</FieldLabel>
              <Input id="address-line1" {...register("line1")} />
              <FieldError errors={[errors.line1]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="address-line2">Address line 2</FieldLabel>
              <Input id="address-line2" {...register("line2")} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="address-city">City</FieldLabel>
                <Input id="address-city" {...register("city")} />
                <FieldError errors={[errors.city]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="address-state">State</FieldLabel>
                <Input id="address-state" {...register("state")} />
                <FieldError errors={[errors.state]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="address-postal">Postal code</FieldLabel>
                <Input id="address-postal" {...register("postalCode")} />
                <FieldError errors={[errors.postalCode]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="address-country">Country</FieldLabel>
                <Input id="address-country" {...register("country")} />
                <FieldError errors={[errors.country]} />
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
