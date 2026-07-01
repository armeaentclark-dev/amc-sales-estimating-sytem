-- Hand-written migration. Same rationale as 0001_auth_trigger.sql and
-- 0003_customer_number_sequence.sql: these tables are only ever
-- queried through Drizzle (direct Postgres connection, bypasses RLS).
-- Enabling RLS with no policies keeps them unreachable through
-- Supabase's PostgREST/client-side API by default.
ALTER TABLE "uoms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cost_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "material_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;
