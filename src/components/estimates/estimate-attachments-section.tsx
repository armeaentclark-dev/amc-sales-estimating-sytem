"use client";

import { Paperclip, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createAttachmentAction,
  deleteAttachmentAction,
} from "@/lib/actions/estimates";
import type { users } from "@/lib/db/schema";

type AttachmentRow = {
  id: string;
  filename: string;
  fileUrl: string;
  uploadedByUser: typeof users.$inferSelect;
};

interface EstimateAttachmentsSectionProps {
  estimateId: string;
  attachments: AttachmentRow[];
}

// MVP: records a filename + URL rather than a real upload widget —
// that would need a dedicated Supabase Storage bucket provisioned out
// of band, the same way "organization-assets" was for the Company
// logo. See DECISIONS.md.
export function EstimateAttachmentsSection({
  estimateId,
  attachments,
}: EstimateAttachmentsSectionProps) {
  const router = useRouter();
  const [filename, setFilename] = React.useState("");
  const [fileUrl, setFileUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleAdd() {
    if (!filename.trim() || !fileUrl.trim()) return;
    setSubmitting(true);
    try {
      await createAttachmentAction(estimateId, { filename, fileUrl });
      toast.success("Attachment added");
      setFilename("");
      setFileUrl("");
      router.refresh();
    } catch {
      toast.error("Failed to add attachment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAttachmentAction(id, estimateId);
      toast.success("Attachment removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove attachment");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {attachments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No attachments yet.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <a
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:underline"
                >
                  <Paperclip className="size-3.5" />
                  {attachment.filename}
                </a>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleDelete(attachment.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <FieldGroup>
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="att-filename">Filename</FieldLabel>
              <Input
                id="att-filename"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="att-url">File URL</FieldLabel>
              <Input
                id="att-url"
                value={fileUrl}
                onChange={(event) => setFileUrl(event.target.value)}
              />
            </Field>
          </div>
        </FieldGroup>
        <Button
          size="sm"
          disabled={submitting || !filename.trim() || !fileUrl.trim()}
          onClick={handleAdd}
        >
          {submitting ? "Adding..." : "Add attachment"}
        </Button>
      </CardContent>
    </Card>
  );
}
