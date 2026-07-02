import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Pricing engine tests seed/clean up real rows in the dev Supabase
    // DB (see DECISIONS.md) — run sequentially so concurrent test
    // files can't race on shared fixture cleanup.
    fileParallelism: false,
    // Every test here makes real network round-trips to the dev
    // Supabase DB (not in-memory) — the estimate lifecycle test alone
    // makes ~10 sequential calls. Vitest's 5s default is too tight for
    // that over a real network; hooks (beforeAll seeding) get the same
    // treatment since they're equally network-bound.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
