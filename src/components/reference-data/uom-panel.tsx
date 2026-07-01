"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createUomAction,
  deleteUomAction,
  updateUomAction,
} from "@/lib/actions/reference-data";
import type { uoms } from "@/lib/db/schema";
import { uomSchema, type UomValues } from "@/lib/validations/reference-data";

type Uom = typeof uoms.$inferSelect;

export function UomPanel({ items }: { items: Uom[] }) {
  const [editing, setEditing] = React.useState<Uom | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          Add unit
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No units of measure yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="flex justify-end gap-1">
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
            ))}
          </TableBody>
        </Table>
      )}
      <UomDialog
        item={editing === "new" ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
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
      await deleteUomAction(id);
      toast.success("Unit removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove unit");
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

function UomDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: Uom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UomValues>({
    resolver: zodResolver(uomSchema),
    defaultValues: { code: item?.code ?? "", name: item?.name ?? "" },
  });

  React.useEffect(() => {
    if (open) reset({ code: item?.code ?? "", name: item?.name ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  async function onSubmit(values: UomValues) {
    try {
      if (item) {
        await updateUomAction(item.id, values);
        toast.success("Unit saved");
      } else {
        await createUomAction(values);
        toast.success("Unit added");
      }
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save unit");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{item ? "Edit unit" : "Add unit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="uom-code">Code</FieldLabel>
              <Input
                id="uom-code"
                placeholder="e.g. EA, FT, LB, HR"
                {...register("code")}
              />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="uom-name">Name</FieldLabel>
              <Input
                id="uom-name"
                placeholder="e.g. Each"
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
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
