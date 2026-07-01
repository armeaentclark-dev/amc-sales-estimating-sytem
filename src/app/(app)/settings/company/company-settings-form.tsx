"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrganizationSettingsAction } from "@/lib/actions/organization-settings";
import type { organizationSettings } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/client";
import {
  type OrganizationSettingsValues,
  organizationSettingsSchema,
} from "@/lib/validations/organization-settings";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP"];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface CompanySettingsFormProps {
  settings: typeof organizationSettings.$inferSelect | null;
}

export function CompanySettingsForm({ settings }: CompanySettingsFormProps) {
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationSettingsValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: settings?.name ?? "",
      logoUrl: settings?.logoUrl ?? "",
      addressLine1: settings?.addressLine1 ?? "",
      addressLine2: settings?.addressLine2 ?? "",
      city: settings?.city ?? "",
      state: settings?.state ?? "",
      postalCode: settings?.postalCode ?? "",
      country: settings?.country ?? "",
      phone: settings?.phone ?? "",
      email: settings?.email ?? "",
      website: settings?.website ?? "",
      taxId: settings?.taxId ?? "",
      currency: settings?.currency ?? "USD",
      timezone: settings?.timezone ?? "America/New_York",
      fiscalYearStartMonth: settings?.fiscalYearStartMonth ?? 1,
    },
  });

  const logoUrl = watch("logoUrl");

  async function onSubmit(values: OrganizationSettingsValues) {
    try {
      await updateOrganizationSettingsAction(values);
      toast.success("Company settings saved");
    } catch {
      toast.error("Failed to save company settings");
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `logo-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("organization-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(path);

      setValue("logoUrl", data.publicUrl, { shouldDirty: true });
      toast.success("Logo uploaded");
    } catch {
      toast.error(
        "Logo upload failed. Make sure the 'organization-assets' storage bucket exists.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldSet>
              <Field orientation="horizontal">
                <Avatar className="size-16 rounded-md">
                  <AvatarImage src={logoUrl ?? undefined} alt="Company logo" />
                  <AvatarFallback className="rounded-md">
                    {(settings?.name ?? "AMC").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <FieldLabel htmlFor="logo">Logo</FieldLabel>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleLogoUpload}
                  />
                  <FieldDescription>
                    PNG or SVG recommended. Uploaded to Supabase Storage.
                  </FieldDescription>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Company name</FieldLabel>
                <Input id="name" {...register("name")} />
                <FieldError errors={[errors.name]} />
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Address</FieldLegend>
              <Field>
                <Input
                  placeholder="Address line 1"
                  {...register("addressLine1")}
                />
              </Field>
              <Field>
                <Input
                  placeholder="Address line 2"
                  {...register("addressLine2")}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Input placeholder="City" {...register("city")} />
                </Field>
                <Field>
                  <Input
                    placeholder="State / Province"
                    {...register("state")}
                  />
                </Field>
                <Field>
                  <Input
                    placeholder="Postal code"
                    {...register("postalCode")}
                  />
                </Field>
                <Field>
                  <Input placeholder="Country" {...register("country")} />
                </Field>
              </div>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Contact information</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <Input placeholder="Phone" {...register("phone")} />
                </Field>
                <Field>
                  <Input placeholder="Email" {...register("email")} />
                  <FieldError errors={[errors.email]} />
                </Field>
              </div>
              <Field>
                <Input placeholder="Website" {...register("website")} />
              </Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Tax & regional settings</FieldLegend>
              <Field>
                <Input placeholder="Tax ID" {...register("taxId")} />
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <Select
                    defaultValue={settings?.currency ?? "USD"}
                    onValueChange={(value) =>
                      setValue("currency", value, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                  <Select
                    defaultValue={settings?.timezone ?? "America/New_York"}
                    onValueChange={(value) =>
                      setValue("timezone", value, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="fiscalYearStartMonth">
                    Fiscal year start
                  </FieldLabel>
                  <Select
                    defaultValue={String(settings?.fiscalYearStartMonth ?? 1)}
                    onValueChange={(value) =>
                      setValue("fiscalYearStartMonth", Number(value), {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="fiscalYearStartMonth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, index) => (
                        <SelectItem key={month} value={String(index + 1)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldSet>

            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
