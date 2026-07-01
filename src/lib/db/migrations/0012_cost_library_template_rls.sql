-- Hand-written migration. Same rationale as prior RLS migrations.
ALTER TABLE "bom_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bom_template_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "labor_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "labor_template_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment_template_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "overhead_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "overhead_template_lines" ENABLE ROW LEVEL SECURITY;
