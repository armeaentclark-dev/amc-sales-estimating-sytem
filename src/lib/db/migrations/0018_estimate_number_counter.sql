-- Hand-written migration. EST-YYYY-NNNNNN resets every calendar year
-- (DOMAIN_MODEL.md §4), unlike every other sequence in this codebase
-- (all flat/global). A plain Postgres SEQUENCE has no built-in yearly
-- reset, so this uses a per-year counter row instead, upserted
-- atomically via ON CONFLICT DO UPDATE ... RETURNING — this is
-- concurrency-safe the same way nextval() is (the row-level lock
-- serializes concurrent callers), satisfying the "never derived from
-- count(*)" requirement in the same section.
--
-- Must run before the generated CREATE TABLE migration that follows,
-- same ordering rule as every other sequence-backed number column.
CREATE TABLE IF NOT EXISTS public.estimate_number_counters (
  "year" text PRIMARY KEY,
  "last_number" integer NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.generate_estimate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year TEXT := to_char(now(), 'YYYY');
  next_number INTEGER;
BEGIN
  INSERT INTO public.estimate_number_counters ("year", "last_number")
  VALUES (current_year, 1)
  ON CONFLICT ("year")
  DO UPDATE SET "last_number" = public.estimate_number_counters."last_number" + 1
  RETURNING "last_number" INTO next_number;

  RETURN 'EST-' || current_year || '-' || LPAD(next_number::text, 6, '0');
END;
$$;
