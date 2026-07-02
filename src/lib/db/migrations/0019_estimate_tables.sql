CREATE TYPE "public"."approval_decision" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."attachment_target_type" AS ENUM('estimate', 'estimate_item');--> statement-breakpoint
CREATE TYPE "public"."note_target_type" AS ENUM('estimate', 'estimate_revision', 'estimate_item');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_revision_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"threshold_reason" text,
	"comment" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_url" text NOT NULL,
	"filename" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"attached_to_type" "attachment_target_type" NOT NULL,
	"attached_to_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_revision_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"product_id" uuid,
	"product_template_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"uom_id" uuid NOT NULL,
	"material_cost" numeric(14, 4),
	"labor_cost" numeric(14, 4),
	"equipment_cost" numeric(14, 4),
	"overhead_cost" numeric(14, 4),
	"total_direct_cost" numeric(14, 4),
	"cost_snapshot_detail" jsonb,
	"manual_cost_override" numeric(14, 4),
	"applied_markup_rule_id" uuid,
	"applied_markup_percent" numeric(7, 4),
	"applied_target_margin_percent" numeric(7, 4),
	"applied_discount_rule_id" uuid,
	"applied_discount_percent" numeric(7, 4),
	"applied_discount_amount" numeric(14, 4),
	"list_price" numeric(14, 4),
	"net_price" numeric(14, 4),
	"extended_price" numeric(14, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- estimate_number_counters is created by 0018_estimate_number_counter.sql
-- (hand-written, so generate_estimate_number()'s default in "estimates"
-- below has something to upsert against). Drizzle's own diff wants to
-- create it again here since it's part of the tracked schema too —
-- skipped to avoid a duplicate-relation error.
CREATE TABLE "estimate_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"status_id" uuid NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	"allowed_next_states" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estimate_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_number" text DEFAULT generate_estimate_number() NOT NULL,
	"customer_id" uuid NOT NULL,
	"salesperson_id" uuid NOT NULL,
	"title" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"valid_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estimates_estimate_number_unique" UNIQUE("estimate_number")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body" text NOT NULL,
	"author_id" uuid NOT NULL,
	"attached_to_type" "note_target_type" NOT NULL,
	"attached_to_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_estimate_revision_id_estimate_revisions_id_fk" FOREIGN KEY ("estimate_revision_id") REFERENCES "public"."estimate_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_estimate_revision_id_estimate_revisions_id_fk" FOREIGN KEY ("estimate_revision_id") REFERENCES "public"."estimate_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_product_template_id_product_templates_id_fk" FOREIGN KEY ("product_template_id") REFERENCES "public"."product_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_uom_id_uoms_id_fk" FOREIGN KEY ("uom_id") REFERENCES "public"."uoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_applied_markup_rule_id_markup_rules_id_fk" FOREIGN KEY ("applied_markup_rule_id") REFERENCES "public"."markup_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_applied_discount_rule_id_discount_rules_id_fk" FOREIGN KEY ("applied_discount_rule_id") REFERENCES "public"."discount_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_revisions" ADD CONSTRAINT "estimate_revisions_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_revisions" ADD CONSTRAINT "estimate_revisions_status_id_estimate_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."estimate_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_revisions" ADD CONSTRAINT "estimate_revisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_salesperson_id_users_id_fk" FOREIGN KEY ("salesperson_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;