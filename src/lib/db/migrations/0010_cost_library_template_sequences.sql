-- Hand-written migration, same pattern as 0007_cost_library_sequences.sql.
-- Must run before the generated CREATE TABLE migration that follows.
CREATE SEQUENCE IF NOT EXISTS public.bom_templates_template_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.labor_templates_template_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.equipment_templates_template_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.overhead_templates_template_number_seq;

CREATE OR REPLACE FUNCTION public.generate_bom_template_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'BOM-' || LPAD(nextval('public.bom_templates_template_number_seq')::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_labor_template_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'LBT-' || LPAD(nextval('public.labor_templates_template_number_seq')::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_equipment_template_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'EQT-' || LPAD(nextval('public.equipment_templates_template_number_seq')::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_overhead_template_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'OHT-' || LPAD(nextval('public.overhead_templates_template_number_seq')::text, 6, '0');
$$;
