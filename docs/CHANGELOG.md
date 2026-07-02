# Changelog

All notable changes to this project will be documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Phase 8: Estimate Builder — the last piece of the original scope.
  - `estimate_statuses` (seeded state machine, 10 states per
    `DOMAIN_MODEL.md` §3.1/§3.4), `estimates` (`EST-YYYY-NNNNNN`,
    year-resetting), `estimate_revisions`, `estimate_items` (full cost
    snapshot), `approvals` (immutable), `attachments`, `notes`.
  - Pricing/margin calculation engine
    (`src/lib/estimating/pricing-engine.ts`) implementing the
    material/labor pricing hierarchies (§3.7/§3.8) and margin math
    (§3.6) as pure, independently-verified functions — see
    `DECISIONS.md` for two formula ambiguities that needed
    interpretation (flagged for review) and the verification approach.
  - `/estimates` list, create form, and a detail page: line items with
    live-computed pricing, status action buttons driving the full
    lifecycle (Draft → InReview → Approved → Sent → Won → Converted,
    plus Rejected/Lost/Expired/Voided and "request changes" at two
    different points per §3.2), approval recording, notes, and
    attachments (URL-entry MVP).
  - Verified end-to-end in a browser: full lifecycle walked from
    creation through Converted in one continuous run, zero console
    errors, computed prices matching hand-calculated values exactly.
- Phase 7: Pricing rules.
  - `markup_rules` (scoped to Product Category/Template/Customer),
    `discount_rules` (Customer scope only in the UI for now —
    Estimate scope needs the next phase), `tax_rules`,
    `customer_pricing_agreements` (§6.3), `approval_thresholds` (§6.4).
  - `/pricing` page with a tab per rule type.
  - Completes the deferred FK from Phase 6:
    `product_templates.default_markup_rule_id` → `markup_rules.id`.
- Phase 6: Products.
  - `product_templates` (`PRT-NNNNNN`, composing BOM/Labor/Equipment/
    Overhead Templates), `products` (`PRD-NNNNNN`, optionally backed
    by a Product Template).
  - `/products` page with Product Templates and Products tabs.
  - `product_templates.default_markup_rule_id` added as a nullable,
    FK-less column — Markup Rule ships in the next phase.
- Phase 5: Cost Library templates.
  - `bom_templates`/`bom_template_lines` (`BOM-NNNNNN`),
    `labor_templates`/`labor_template_lines` (`LBT-NNNNNN`),
    `equipment_templates`/`equipment_template_lines` (`EQT-NNNNNN`),
    `overhead_templates`/`overhead_template_lines` (`OHT-NNNNNN`) —
    the reusable "recipes" a Product Template will compose in the
    next phase.
  - `/cost-library/templates` page with a tab per template type, each
    with a "manage lines" action for its line items.
- Phase 4: Cost Library core.
  - `materials` (`MAT-NNNNNN`), `labor_processes` (`LAB-NNNNNN`) +
    effective-dated `labor_rates`, `equipment` (`EQP-NNNNNN`).
  - Cost Library page (`/cost-library`) with Materials/Labor/Equipment
    tabs; Labor processes have a "manage rates" action for adding/
    removing effective-dated rate records.
- Phase 3: Reference data.
  - `uoms`, `cost_categories`, `material_categories`,
    `product_categories` (self-referencing hierarchy) — shared lookups
    for the upcoming Cost Library and Product catalog.
  - Salesperson fields (`employee_code`, `region`, `commission_rate`)
    added directly to `users`, per `DOMAIN_MODEL.md`'s "Salesperson is
    a business role a User plays" — no separate table.
  - Settings → Reference Data page with a tab per lookup type,
    add/edit/delete for each.
- Phase 2: Customers.
  - **Schema**: `customers` (`CUS-NNNNNN` numbering via a Postgres
    sequence), `contacts`, `addresses` — the Company (parent org
    rollup) entity from the domain model is deferred; `customers`
    carries a nullable, unreferenced `company_id` column for it.
  - **CRUD**: list page with search (`/customers`), create
    (`/customers/new`), and a detail page (`/customers/[id]`) with
    inline add/edit/delete for Contacts and Addresses.
  - No new RBAC permission codes yet — Customers CRUD just requires
    login, consistent with Phase 1's "permissions populated
    incrementally per module" approach.
- Phase 1: platform foundation.
  - **Auth**: Supabase Auth login (no registration — internal user
    provisioning only), session-refresh middleware, layered route
    protection (middleware + server-side check), logout server action.
  - **App shell**: shadcn "sidebar" block, top nav, breadcrumbs, user
    menu, dark-mode toggle (`next-themes`), responsive layout, route-
    segment `loading.tsx`/`error.tsx` + root `global-error.tsx`.
  - **RBAC schema**: `roles`, `permissions`, `role_permissions`,
    `users` (profile table extending `auth.users` via a Postgres
    trigger) — schema and seed data only, no CRUD UI yet.
  - **Company (Organization) Settings**: full profile/address/contact/
    tax/regional settings screen with logo upload, backed by a new
    singleton `organization_settings` table.
  - **Design system**: `DataTable`, `EmptyState`, `PageHeader`,
    `StatusChip`, `SearchBar` composites on top of newly added shadcn
    primitives (button, input, select, dialog, sheet, sidebar, table,
    etc.), using shadcn's `Field` primitive system for forms.
  - `pnpm db:seed` script (default roles + `organization_settings`
    row).
- Initial project scaffold: Next.js 15 (App Router, TypeScript, Tailwind
  CSS v4, ESLint), shadcn/ui (Radix, Nova preset), Supabase client
  wiring (`@supabase/ssr`), Drizzle ORM + `postgres-js` driver, React
  Hook Form + Zod, TanStack Table, Zustand, Lucide icons.
- Tooling: Prettier (with Tailwind class sorting), Husky pre-commit hook
  running lint-staged.
- `/docs` structure: product requirements, architecture, database
  design, UI/UX guidelines, coding standards, roadmap, decisions log,
  and this changelog.
- Phase 0.5: full business domain model, ERD, business rules, numbering
  standards, and ERP integration boundaries
  ([DOMAIN_MODEL.md](../docs/DOMAIN_MODEL.md)), including the
  centralized Cost Library architecture decision.
