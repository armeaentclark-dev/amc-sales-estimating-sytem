import { config } from "dotenv";

config({ path: ".env.local" });

const DEFAULT_ROLES = [
  {
    code: "admin",
    name: "Administrator",
    description: "Full access to all platform and business modules.",
  },
  {
    code: "sales",
    name: "Sales",
    description: "Manages customers and estimates.",
  },
  {
    code: "estimator",
    name: "Estimator",
    description: "Builds and prices estimates.",
  },
] as const;

// DOMAIN_MODEL.md §3.1 (state diagram) / §3.4 (transitions table).
const DEFAULT_ESTIMATE_STATUSES = [
  {
    code: "draft",
    label: "Draft",
    isTerminal: false,
    allowedNextStates: ["in_review", "voided"],
  },
  {
    code: "in_review",
    label: "In Review",
    isTerminal: false,
    allowedNextStates: ["draft", "approved", "rejected"],
  },
  {
    code: "approved",
    label: "Approved",
    isTerminal: false,
    allowedNextStates: ["sent"],
  },
  {
    code: "rejected",
    label: "Rejected",
    isTerminal: true,
    allowedNextStates: [],
  },
  {
    code: "sent",
    label: "Sent",
    isTerminal: false,
    allowedNextStates: ["won", "lost", "expired", "draft"],
  },
  {
    code: "won",
    label: "Won",
    isTerminal: false,
    allowedNextStates: ["converted"],
  },
  { code: "lost", label: "Lost", isTerminal: true, allowedNextStates: [] },
  {
    code: "expired",
    label: "Expired",
    isTerminal: true,
    allowedNextStates: [],
  },
  { code: "voided", label: "Voided", isTerminal: true, allowedNextStates: [] },
  {
    code: "converted",
    label: "Converted",
    isTerminal: true,
    allowedNextStates: [],
  },
] as const;

async function seed() {
  const { db } = await import("./client");
  const { estimateStatuses, organizationSettings, roles } =
    await import("./schema");

  console.log("Seeding roles...");
  await db
    .insert(roles)
    .values([...DEFAULT_ROLES])
    .onConflictDoNothing({ target: roles.code });

  console.log("Seeding estimate statuses...");
  await db
    .insert(estimateStatuses)
    .values(
      DEFAULT_ESTIMATE_STATUSES.map((status) => ({
        ...status,
        allowedNextStates: [...status.allowedNextStates],
      })),
    )
    .onConflictDoNothing({ target: estimateStatuses.code });

  console.log("Seeding organization settings...");
  const existing = await db.select().from(organizationSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(organizationSettings).values({
      name: "AMC",
    });
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
