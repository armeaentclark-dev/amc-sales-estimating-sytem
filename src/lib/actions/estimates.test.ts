import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createCustomerAction } from "@/lib/actions/customers";
import {
  createEstimateAction,
  getEstimate,
  markConvertedAction,
  markSentAction,
  markWonAction,
  recordApprovalAction,
  requestChangesOnSentAction,
  submitForReviewAction,
} from "@/lib/actions/estimates";
import { db } from "@/lib/db/client";
import { customers, estimates, users } from "@/lib/db/schema";

// Estimate actions resolve the current user via
// createClient().auth.getUser(), which needs next/headers' cookies()
// — unavailable outside a real request, same problem revalidatePath
// has (see vitest.setup.ts). Mocked here to return a real seeded
// user's id (FK constraints on salesperson_id/created_by/approver_id
// need a row that actually exists) rather than a fabricated UUID.
const testUserId = vi.hoisted(() => ({ current: null as string | null }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId.current } } }),
    },
  }),
}));

let customerId: string;
const createdEstimateIds: string[] = [];

beforeAll(async () => {
  const [anyUser] = await db.select({ id: users.id }).from(users).limit(1);
  if (!anyUser)
    throw new Error("No users in dev DB to run estimate tests against");
  testUserId.current = anyUser.id;

  const customer = await createCustomerAction({
    name: "__vitest__ estimate customer",
    status: "active",
    paymentTerms: "",
  });
  if (!customer)
    throw new Error("setup failed: could not create test customer");
  customerId = customer.id;
});

afterAll(async () => {
  for (const id of createdEstimateIds) {
    await db.delete(estimates).where(eq(estimates.id, id));
  }
  if (customerId) {
    await db.delete(customers).where(eq(customers.id, customerId));
  }
});

async function createTestEstimate(title: string) {
  const estimate = await createEstimateAction({
    customerId,
    salespersonId: testUserId.current!,
    title,
    currency: "USD",
    validUntil: "",
  });
  if (!estimate)
    throw new Error("setup failed: could not create test estimate");
  createdEstimateIds.push(estimate.id);
  return estimate;
}

function currentRevision(
  estimate: NonNullable<Awaited<ReturnType<typeof getEstimate>>>,
) {
  const revision =
    estimate.revisions.find((r) => r.isCurrent) ?? estimate.revisions[0];
  if (!revision) throw new Error("estimate has no revisions");
  return revision;
}

describe("Estimate lifecycle state machine", () => {
  it("creates a Draft revision 1 with a generated EST-YYYY-NNNNNN number", async () => {
    const estimate = await createTestEstimate("__vitest__ draft check");
    expect(estimate.estimateNumber).toMatch(/^EST-\d{4}-\d{6}$/);

    const full = await getEstimate(estimate.id);
    const revision = currentRevision(full!);
    expect(revision.revisionNumber).toBe(1);
    expect(revision.status.code).toBe("draft");
  });

  it("rejects an illegal transition (draft -> sent, skipping the workflow)", async () => {
    const estimate = await createTestEstimate("__vitest__ illegal transition");
    const full = await getEstimate(estimate.id);
    const revision = currentRevision(full!);

    await expect(markSentAction(revision.id)).rejects.toThrow(/Cannot move/);
  });

  it("walks the full happy path: draft -> in_review -> approved -> sent -> won -> converted", async () => {
    const estimate = await createTestEstimate("__vitest__ happy path");
    const revisionId = currentRevision((await getEstimate(estimate.id))!).id;

    await submitForReviewAction(revisionId);
    expect(currentRevision((await getEstimate(estimate.id))!).status.code).toBe(
      "in_review",
    );

    await recordApprovalAction(revisionId, {
      decision: "approved",
      comment: "looks good",
    });
    const afterApproval = await getEstimate(estimate.id);
    expect(currentRevision(afterApproval!).status.code).toBe("approved");
    expect(currentRevision(afterApproval!).approvals).toHaveLength(1);
    expect(currentRevision(afterApproval!).approvals[0].decision).toBe(
      "approved",
    );

    await markSentAction(revisionId);
    expect(currentRevision((await getEstimate(estimate.id))!).status.code).toBe(
      "sent",
    );

    await markWonAction(revisionId);
    expect(currentRevision((await getEstimate(estimate.id))!).status.code).toBe(
      "won",
    );

    await markConvertedAction(revisionId);
    const final = currentRevision((await getEstimate(estimate.id))!);
    expect(final.status.code).toBe("converted");
    expect(final.status.isTerminal).toBe(true);
  });

  it("moves a revision to rejected when an approval is rejected", async () => {
    const estimate = await createTestEstimate("__vitest__ rejection path");
    const revisionId = currentRevision((await getEstimate(estimate.id))!).id;

    await submitForReviewAction(revisionId);
    await recordApprovalAction(revisionId, {
      decision: "rejected",
      comment: "too low margin",
    });

    const revision = currentRevision((await getEstimate(estimate.id))!);
    expect(revision.status.code).toBe("rejected");
    expect(revision.status.isTerminal).toBe(true);
  });

  it("creates a new superseding Draft revision when changes are requested on a Sent estimate", async () => {
    const estimate = await createTestEstimate("__vitest__ request changes");
    const revisionId = currentRevision((await getEstimate(estimate.id))!).id;

    await submitForReviewAction(revisionId);
    await recordApprovalAction(revisionId, { decision: "approved" });
    await markSentAction(revisionId);

    await requestChangesOnSentAction(revisionId);

    const full = await getEstimate(estimate.id);
    expect(full!.revisions).toHaveLength(2);

    const newRevision = full!.revisions.find((r) => r.isCurrent)!;
    const oldRevision = full!.revisions.find((r) => r.id === revisionId)!;

    expect(newRevision.revisionNumber).toBe(2);
    expect(newRevision.status.code).toBe("draft");
    expect(oldRevision.isCurrent).toBe(false);
    expect(oldRevision.supersededAt).not.toBeNull();
  });
});
