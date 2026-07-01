CREATE TYPE "public"."discount_scope_type" AS ENUM('customer', 'estimate');--> statement-breakpoint
CREATE TYPE "public"."markup_scope_type" AS ENUM('product_category', 'product_template', 'customer');--> statement-breakpoint
CREATE TYPE "public"."pricing_agreement_scope_type" AS ENUM('material', 'labor_process');--> statement-breakpoint
CREATE TABLE "approval_thresholds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"margin_floor_percent" numeric(7, 4),
	"value_ceiling" numeric(14, 4),
	"product_category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_pricing_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"scope_type" "pricing_agreement_scope_type" NOT NULL,
	"scope_id" uuid NOT NULL,
	"negotiated_rate" numeric(12, 4) NOT NULL,
	"effective_date" date NOT NULL,
	"expires_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" "discount_scope_type" NOT NULL,
	"scope_id" uuid NOT NULL,
	"discount_percent" numeric(7, 4),
	"discount_amount" numeric(12, 4),
	"min_quantity" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markup_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" "markup_scope_type" NOT NULL,
	"scope_id" uuid NOT NULL,
	"markup_percent" numeric(7, 4),
	"target_margin_percent" numeric(7, 4),
	"effective_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" text NOT NULL,
	"rate_percent" numeric(7, 4) NOT NULL,
	"product_category_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_thresholds" ADD CONSTRAINT "approval_thresholds_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_pricing_agreements" ADD CONSTRAINT "customer_pricing_agreements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_product_category_id_product_categories_id_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_default_markup_rule_id_markup_rules_id_fk" FOREIGN KEY ("default_markup_rule_id") REFERENCES "public"."markup_rules"("id") ON DELETE no action ON UPDATE no action;