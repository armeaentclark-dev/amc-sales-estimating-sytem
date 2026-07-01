CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_number" text DEFAULT generate_equipment_number() NOT NULL,
	"name" text NOT NULL,
	"cost_category_id" uuid NOT NULL,
	"rate_per_hour" numeric(12, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_equipment_number_unique" UNIQUE("equipment_number")
);
--> statement-breakpoint
CREATE TABLE "labor_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT generate_labor_process_number() NOT NULL,
	"name" text NOT NULL,
	"cost_category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "labor_processes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "labor_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"labor_process_id" uuid,
	"cost_category_id" uuid,
	"rate_per_hour" numeric(12, 4) NOT NULL,
	"effective_date" date NOT NULL,
	"expires_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_number" text DEFAULT generate_material_number() NOT NULL,
	"name" text NOT NULL,
	"material_category_id" uuid NOT NULL,
	"uom_id" uuid NOT NULL,
	"current_unit_cost" numeric(12, 4) NOT NULL,
	"cost_category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_material_number_unique" UNIQUE("material_number")
);
--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_cost_category_id_cost_categories_id_fk" FOREIGN KEY ("cost_category_id") REFERENCES "public"."cost_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_processes" ADD CONSTRAINT "labor_processes_cost_category_id_cost_categories_id_fk" FOREIGN KEY ("cost_category_id") REFERENCES "public"."cost_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_rates" ADD CONSTRAINT "labor_rates_labor_process_id_labor_processes_id_fk" FOREIGN KEY ("labor_process_id") REFERENCES "public"."labor_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labor_rates" ADD CONSTRAINT "labor_rates_cost_category_id_cost_categories_id_fk" FOREIGN KEY ("cost_category_id") REFERENCES "public"."cost_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_material_category_id_material_categories_id_fk" FOREIGN KEY ("material_category_id") REFERENCES "public"."material_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_uom_id_uoms_id_fk" FOREIGN KEY ("uom_id") REFERENCES "public"."uoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_cost_category_id_cost_categories_id_fk" FOREIGN KEY ("cost_category_id") REFERENCES "public"."cost_categories"("id") ON DELETE no action ON UPDATE no action;