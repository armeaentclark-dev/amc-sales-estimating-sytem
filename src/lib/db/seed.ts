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

async function seed() {
  const { db } = await import("./client");
  const { organizationSettings, roles } = await import("./schema");

  console.log("Seeding roles...");
  await db
    .insert(roles)
    .values([...DEFAULT_ROLES])
    .onConflictDoNothing({ target: roles.code });

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
