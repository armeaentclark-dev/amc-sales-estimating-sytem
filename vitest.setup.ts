import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env.local" });

// Server actions call revalidatePath/revalidateTag, which need
// Next.js's request-scoped "static generation store" — that doesn't
// exist outside an actual request, so it throws
// ("Invariant: static generation store missing") when a "use server"
// action is called directly from a test. Mocked as no-ops here so
// action tests can exercise the real DB logic without a live Next.js
// server. See DECISIONS.md.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
