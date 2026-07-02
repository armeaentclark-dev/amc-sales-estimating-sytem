"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  markConvertedAction,
  markExpiredAction,
  markLostAction,
  markSentAction,
  markVoidedAction,
  markWonAction,
  recordApprovalAction,
  requestChangesInReviewAction,
  requestChangesOnSentAction,
  submitForReviewAction,
} from "@/lib/actions/estimates";

interface EstimateStatusActionsProps {
  estimateId: string;
  revisionId: string;
  statusCode: string;
  approvalReasons: string[];
}

export function EstimateStatusActions({
  estimateId,
  revisionId,
  statusCode,
  approvalReasons,
}: EstimateStatusActionsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [approvalDialog, setApprovalDialog] = React.useState<
    "approved" | "rejected" | null
  >(null);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setPending(true);
    try {
      await action();
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setPending(false);
    }
  }

  const buttons: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive";
  }[] = [];

  if (statusCode === "draft") {
    buttons.push({
      label: "Submit for review",
      onClick: () =>
        run(() => submitForReviewAction(revisionId), "Submitted for review"),
    });
    buttons.push({
      label: "Void",
      variant: "outline",
      onClick: () => run(() => markVoidedAction(revisionId), "Estimate voided"),
    });
  } else if (statusCode === "in_review") {
    buttons.push({
      label: "Approve",
      onClick: () => setApprovalDialog("approved"),
    });
    buttons.push({
      label: "Reject",
      variant: "destructive",
      onClick: () => setApprovalDialog("rejected"),
    });
    buttons.push({
      label: "Request changes",
      variant: "outline",
      onClick: () =>
        run(
          () => requestChangesInReviewAction(revisionId),
          "Sent back to draft",
        ),
    });
  } else if (statusCode === "approved") {
    buttons.push({
      label: "Mark sent",
      onClick: () => run(() => markSentAction(revisionId), "Marked as sent"),
    });
  } else if (statusCode === "sent") {
    buttons.push({
      label: "Mark won",
      onClick: () => run(() => markWonAction(revisionId), "Marked as won"),
    });
    buttons.push({
      label: "Mark lost",
      variant: "outline",
      onClick: () => run(() => markLostAction(revisionId), "Marked as lost"),
    });
    buttons.push({
      label: "Mark expired",
      variant: "outline",
      onClick: () =>
        run(() => markExpiredAction(revisionId), "Marked as expired"),
    });
    buttons.push({
      label: "Request changes",
      variant: "outline",
      onClick: () =>
        run(
          () => requestChangesOnSentAction(revisionId),
          "New draft revision created",
        ),
    });
  } else if (statusCode === "won") {
    buttons.push({
      label: "Mark converted",
      onClick: () =>
        run(() => markConvertedAction(revisionId), "Marked as converted"),
    });
  }

  if (buttons.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {buttons.map((button) => (
          <Button
            key={button.label}
            variant={button.variant ?? "default"}
            disabled={pending}
            onClick={button.onClick}
          >
            {button.label}
          </Button>
        ))}
      </CardContent>
      <ApprovalDialog
        estimateId={estimateId}
        revisionId={revisionId}
        decision={approvalDialog}
        approvalReasons={approvalReasons}
        onOpenChange={(open) => !open && setApprovalDialog(null)}
      />
    </Card>
  );
}

function ApprovalDialog({
  revisionId,
  decision,
  approvalReasons,
  onOpenChange,
}: {
  estimateId: string;
  revisionId: string;
  decision: "approved" | "rejected" | null;
  approvalReasons: string[];
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit() {
    if (!decision) return;
    setSubmitting(true);
    try {
      await recordApprovalAction(revisionId, {
        decision,
        comment,
        thresholdReason: approvalReasons.join("; "),
      });
      toast.success(decision === "approved" ? "Approved" : "Rejected");
      setComment("");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record decision",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={decision !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {decision === "approved" ? "Approve" : "Reject"} revision
          </DialogTitle>
        </DialogHeader>
        {approvalReasons.length > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">Approval threshold(s) triggered:</p>
            <ul className="mt-1 list-disc pl-4">
              {approvalReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No approval thresholds are currently breached for this revision.
          </p>
        )}
        <Textarea
          placeholder="Comment (optional)"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <DialogFooter>
          <Button
            variant={decision === "rejected" ? "destructive" : "default"}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? "Saving..."
              : decision === "approved"
                ? "Approve"
                : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
