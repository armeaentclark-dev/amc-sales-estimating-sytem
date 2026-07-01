-- Hand-written migration (drizzle-kit can't express a formatted
-- sequence-backed column default).

-- Backs customer_number's CUS-NNNNNN format (§4 Numbering Standards,
-- DOMAIN_MODEL.md) with a plain global sequence.
CREATE SEQUENCE IF NOT EXISTS public.customers_customer_number_seq;

CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'CUS-' || LPAD(nextval('public.customers_customer_number_seq')::text, 6, '0');
$$;

ALTER TABLE "customers"
  ALTER COLUMN "customer_number" SET DEFAULT public.generate_customer_number();

-- Same rationale as 0001_auth_trigger.sql: these tables are only ever
-- queried through Drizzle (direct Postgres connection, bypasses RLS).
-- Enabling RLS with no policies keeps them unreachable through
-- Supabase's PostgREST/client-side API by default.
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
