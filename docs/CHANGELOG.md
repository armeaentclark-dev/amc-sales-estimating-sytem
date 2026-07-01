# Changelog

All notable changes to this project will be documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

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
