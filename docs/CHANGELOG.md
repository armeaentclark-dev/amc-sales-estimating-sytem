# Changelog

All notable changes to this project will be documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

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
