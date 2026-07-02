"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createNoteAction, deleteNoteAction } from "@/lib/actions/estimates";
import type { users } from "@/lib/db/schema";

type NoteRow = {
  id: string;
  body: string;
  createdAt: Date;
  author: typeof users.$inferSelect;
};

interface EstimateNotesSectionProps {
  estimateId: string;
  targetType: "estimate" | "estimate_revision" | "estimate_item";
  targetId: string;
  notes: NoteRow[];
  title?: string;
}

export function EstimateNotesSection({
  estimateId,
  targetType,
  targetId,
  notes,
  title = "Notes",
}: EstimateNotesSectionProps) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleAdd() {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await createNoteAction(targetType, targetId, estimateId, { body });
      toast.success("Note added");
      setBody("");
      router.refresh();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNoteAction(id, estimateId);
      toast.success("Note removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove note");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {note.author.fullName ?? note.author.email}
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive text-xs"
                    onClick={() => handleDelete(note.id)}
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <Button
          size="sm"
          disabled={submitting || !body.trim()}
          onClick={handleAdd}
        >
          {submitting ? "Adding..." : "Add note"}
        </Button>
      </CardContent>
    </Card>
  );
}
