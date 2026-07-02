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
  },
});
