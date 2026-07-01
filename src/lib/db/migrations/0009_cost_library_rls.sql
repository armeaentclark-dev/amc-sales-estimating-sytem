-- Hand-written migration. Same rationale as prior RLS migrations:
-- Drizzle-only tables get RLS enabled with no policies as a
-- deny-by-default safeguard against the Supabase client-side API.
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "labor_processes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "labor_rates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment" ENABLE ROW LEVEL SECURITY;
