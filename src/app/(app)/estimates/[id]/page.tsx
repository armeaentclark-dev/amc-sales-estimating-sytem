import { notFound } from "next/navigation";

import { EstimateAttachmentsSection } from "@/components/estimates/estimate-attachments-section";
import { EstimateItemsSection } from "@/components/estimates/estimate-items-section";
import { EstimateNotesSection } from "@/components/estimates/estimate-notes-section";
import { EstimateStatusActions } from "@/components/estimates/estimate-status-actions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEstimate } from "@/lib/actions/estimates";
import { getApprovalThresholds } from "@/lib/actions/pricing";
import { getProductTemplates, getProducts } from "@/lib/actions/products";
import { getUoms } from "@/lib/actions/reference-data";

interface EstimateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EstimateDetailPage({
  params,
}: EstimateDetailPageProps) {
  const { id } = await params;
  const [estimate, thresholds, products, productTemplates, uoms] =
    await Promise.all([
      getEstimate(id),
      getApprovalThresholds(),
      getProducts(),
      getProductTemplates(),
      getUoms(),
    ]);

  if (!estimate) notFound();

  const currentRevision =
    estimate.revisions.find((r) => r.isCurrent) ?? estimate.revisions[0];
  const otherRevisions = estimate.revisions.filter(
    (r) => r.id !== currentRevision?.id,
  );

  const approvalReasons: string[] = [];
  if (currentRevision) {
    for (const threshold of thresholds) {
      if (
        threshold.marginFloorPercent !== null &&
        currentRevision.totals.marginPercent !== null &&
        currentRevision.totals.marginPercent * 100 <
          Number(threshold.marginFloorPercent)
      ) {
        approvalReasons.push(
          `"${threshold.name}": margin ${(currentRevision.totals.marginPercent * 100).toFixed(1)}% is below the ${threshold.marginFloorPercent}% floor`,
        );
      }
      if (
        threshold.valueCeiling !== null &&
        currentRevision.totals.total > Number(threshold.valueCeiling)
      ) {
        approvalReasons.push(
          `"${threshold.name}": total $${currentRevision.totals.total.toFixed(2)} exceeds the $${threshold.valueCeiling} ceiling`,
        );
      }
    }
  }

  const isEditable = currentRevision?.status.code === "draft";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={estimate.title}
        description={`${estimate.estimateNumber} · ${estimate.customer.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Estimates", href: "/estimates" },
          { label: estimate.estimateNumber },
        ]}
        actions={
          currentRevision ? (
            <Badge variant="outline">
              Revision {currentRevision.revisionNumber} ·{" "}
              {currentRevision.status.label}
            </Badge>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {currentRevision ? (
            <EstimateItemsSection
              revision={currentRevision}
              isEditable={isEditable}
              products={products}
              productTemplates={productTemplates}
              uoms={uoms}
            />
          ) : null}

          {currentRevision ? (
            <Card>
              <CardHeader>
                <CardTitle>Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRevision.approvals.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No approval decisions yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {currentRevision.approvals.map((approval) => (
                      <li
                        key={approval.id}
                        className="rounded-md border p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {approval.approver.fullName ??
                              approval.approver.email}
                          </span>
                          <Badge
                            variant={
                              approval.decision === "approved"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {approval.decision}
                          </Badge>
                        </div>
                        {approval.thresholdReason ? (
                          <p className="text-muted-foreground mt-1">
                            {approval.thresholdReason}
                          </p>
                        ) : null}
                        {approval.comment ? (
                          <p className="mt-1">{approval.comment}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}

          <EstimateNotesSection
            estimateId={estimate.id}
            targetType="estimate"
            targetId={estimate.id}
            notes={estimate.notes}
            title="Notes"
          />

          <EstimateAttachmentsSection
            estimateId={estimate.id}
            attachments={estimate.attachments}
          />
        </div>

        <div className="space-y-6">
          {currentRevision ? (
            <EstimateStatusActions
              estimateId={estimate.id}
              revisionId={currentRevision.id}
              statusCode={currentRevision.status.code}
              approvalReasons={approvalReasons}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span>{estimate.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salesperson</span>
                <span>
                  {estimate.salesperson.fullName ?? estimate.salesperson.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span>{estimate.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid until</span>
                <span>{estimate.validUntil ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          {otherRevisions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Revision history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {otherRevisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="flex justify-between border-b pb-2 last:border-0"
                  >
                    <span>Revision {revision.revisionNumber}</span>
                    <Badge variant="outline">{revision.status.label}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
