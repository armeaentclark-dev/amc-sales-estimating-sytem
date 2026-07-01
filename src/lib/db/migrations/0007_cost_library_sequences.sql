-- Hand-written migration, same pattern as
-- 0003_customer_number_sequence.sql: creates the sequences + format
-- functions that 0008's CREATE TABLE column defaults reference. Must
-- run before 0008.
CREATE SEQUENCE IF NOT EXISTS public.materials_material_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.labor_processes_code_seq;
CREATE SEQUENCE IF NOT EXISTS public.equipment_equipment_number_seq;

CREATE OR REPLACE FUNCTION public.generate_material_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'MAT-' || LPAD(nextval('public.materials_material_number_seq')::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_labor_process_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'LAB-' || LPAD(nextval('public.labor_processes_code_seq')::text, 6, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_equipment_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'EQP-' || LPAD(nextval('public.equipment_equipment_number_seq')::text, 6, '0');
$$;
