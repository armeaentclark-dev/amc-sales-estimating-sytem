CREATE TABLE "product_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_number" text DEFAULT generate_product_template_number() NOT NULL,
	"name" text NOT NULL,
	"product_category_id" uuid NOT NULL,
	"bom_template_id" uuid,
	"labor_template_id" uuid,
	"equipment_template_id" uuid,
	"overhead_template_id" uuid,
	"default_markup_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_templates_template_number_unique" UNIQUE("template_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_number" text DEFAULT generate_product_number() NOT NULL,
	"name" text NOT NULL,
	"product_category_id" uuid NOT NULL,
	"product_template_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_product_number_unique" UNIQUE("product_number")
);
--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_bom_template_id_bom_templates_id_fk" FOREIGN KEY ("bom_template_id") REFERENCES "public"."bom_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_labor_template_id_labor_templates_id_fk" FOREIGN KEY ("labor_template_id") REFERENCES "public"."labor_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_equipment_template_id_equipment_templates_id_fk" FOREIGN KEY ("equipment_template_id") REFERENCES "public"."equipment_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_overhead_template_id_overhead_templates_id_fk" FOREIGN KEY ("overhead_template_id") REFERENCES "public"."overhead_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_template_id_product_templates_id_fk" FOREIGN KEY ("product_template_id") REFERENCES "public"."product_templates"("id") ON DELETE no action ON UPDATE no action;