-- Hand-written migration, same pattern as 0010_cost_library_template_sequences.sql.
-- Must run before the generated CREATE TABLE migration that follows.
CREATE SEQUENCE IF NOT EXISTS public.product_templates_template_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.products_product_number_seq;

CREATE OR REPLACE FUNCTION public.generate_product_template_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'PRT-' || LPAD(nextval('public.product_templates_template_number_seq')::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_product_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'PRD-' || LPAD(nextval('public.products_product_number_seq')::text, 6, '0');
$$;
