CREATE TYPE "public"."overhead_allocation_method" AS ENUM('percent_of_labor', 'percent_of_direct_cost', 'flat_per_unit');--> statement-breakpoint
CREATE TABLE "bom_template_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_template_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"uom_id" uuid NOT NULL,
	"scrap_percent" numeric(5, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bom_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_number" text DEFAULT generate_bom_template_number() NOT NULL,
	"name" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bom_templates_template_number_unique" UNIQUE("template_number")
);
--> statement-breakpoint
CREATE TABLE "equipment_template_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_template_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"standard_hours" numeric(10, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_number" text DEFAULT generate_equipment_template_number() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_templates_template_number_unique" UNIQUE("template_number")
);
--> statement-breakpoint
CREATE TABLE "labor_template_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"labor_template_id" uuid NOT NULL,
	"labor_process_id" uuid NOT NULL,
	"standard_hours" numeric(10, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labor_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_number" text DEFAULT generate_labor_template_number() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "labor_templates_template_number_unique" UNIQUE("template_number")
);
--> statement-breakpoint
CREATE TABLE "overhead_template_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"overhead_template_id" uuid NOT NULL,
	"cost_category_id" uuid NOT NULL,
	"allocation_method" "overhead_allocation_method" NOT NULL,
	"rate" numeric(12, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overhead_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_number" text DEFAULT generate_overhead_template_number() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "overhead_templates_template_number_unique" UNIQUE("template_number")
);
--> statement-breakpoint
ALTER TABLE "bom_template_lines" ADD CONSTRAINT "bom_template_lines_bom_template_id_bom_templates_id_fk" FOREIGN KEY ("bom_template_id") REFERENCES "public"."bom_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_template_lines" ADD CONSTRAINT "bom_template_lines_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_template_lines" ADD CONSTRAINT "bom_template_lines_uom_id_uoms_id_fk" FOREIGN KEY ("uom_id") REFERENCES "public"."uoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_template_lines" ADD CONSTRAINT "equipment_template_lines_equipment_template_id_equipment_templates_id_fk" FOREIGN KEY ("equipment_template_id") REFERENCES "public"."equipment_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_template_lines" ADD CONSTRAINT "equipment_template_lines_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_template_lines" ADD CONSTRAINT "labor_template_lines_labor_template_id_labor_templates_id_fk" FOREIGN KEY ("labor_template_id") REFERENCES "public"."labor_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_template_lines" ADD CONSTRAINT "labor_template_lines_labor_process_id_labor_processes_id_fk" FOREIGN KEY ("labor_process_id") REFERENCES "public"."labor_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overhead_template_lines" ADD CONSTRAINT "overhead_template_lines_overhead_template_id_overhead_templates_id_fk" FOREIGN KEY ("overhead_template_id") REFERENCES "public"."overhead_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overhead_template_lines" ADD CONSTRAINT "overhead_template_lines_cost_category_id_cost_categories_id_fk" FOREIGN KEY ("cost_category_id") REFERENCES "public"."cost_categories"("id") ON DELETE no action ON UPDATE no action;