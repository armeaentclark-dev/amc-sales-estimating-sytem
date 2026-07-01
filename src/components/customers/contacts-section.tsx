"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  createContactAction,
  deleteContactAction,
  updateContactAction,
} from "@/lib/actions/customers";
import type { contacts } from "@/lib/db/schema";
import { contactSchema, type ContactValues } from "@/lib/validations/customer";

type Contact = typeof contacts.$inferSelect;

interface ContactsSectionProps {
  customerId: string;
  contacts: Contact[];
}

export function ContactsSection({
  customerId,
  contacts,
}: ContactsSectionProps) {
  const [editing, setEditing] = React.useState<Contact | "new" | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Contacts</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
          <Plus />
          Add contact
        </Button>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <EmptyState
            title="No contacts yet"
            description="Add a buyer, engineer, or AP contact for this customer."
          />
        ) : (
          <ul className="divide-y">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.name}</span>
                    {contact.isPrimary ? (
                      <Badge variant="outline" className="gap-1">
                        <Star className="size-3" />
                        Primary
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {[contact.title, contact.email, contact.phone]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setEditing(contact)}
                  >
                    <Pencil />
                  </Button>
                  <DeleteContactButton
                    contactId={contact.id}
                    customerId={customerId}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <ContactDialog
        customerId={customerId}
        contact={editing === "new" ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </Card>
  );
}

function DeleteContactButton({
  contactId,
  customerId,
}: {
  contactId: string;
  customerId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteContactAction(contactId, customerId);
      toast.success("Contact removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove contact");
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

interface ContactDialogProps {
  customerId: string;
  contact?: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ContactDialog({
  customerId,
  contact,
  open,
  onOpenChange,
}: ContactDialogProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name ?? "",
      title: contact?.title ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      isPrimary: contact?.isPrimary ?? false,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: contact?.name ?? "",
        title: contact?.title ?? "",
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        isPrimary: contact?.isPrimary ?? false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact]);

  const isPrimary = watch("isPrimary");

  async function onSubmit(values: ContactValues) {
    try {
      if (contact) {
        await updateContactAction(contact.id, customerId, values);
        toast.success("Contact saved");
      } else {
        await createContactAction(customerId, values);
        toast.success("Contact added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save contact");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contact-name">Name</FieldLabel>
              <Input id="contact-name" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-title">Title</FieldLabel>
              <Input id="contact-title" {...register("title")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              <Input id="contact-email" {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
              <Input id="contact-phone" {...register("phone")} />
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="contact-primary"
                checked={isPrimary}
                onCheckedChange={(checked) =>
                  setValue("isPrimary", checked === true, {
                    shouldDirty: true,
                  })
                }
              />
              <FieldLabel htmlFor="contact-primary">Primary contact</FieldLabel>
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
