# Architectural Decisions

Short ADR-style log of notable decisions. Newest first.

---

## 2026-07-01 — RLS enabled with no policies on Drizzle-only tables

The 5 Phase 1 tables are only ever accessed via the Drizzle client over
a direct Postgres connection, which uses a privileged role that bypasses
Row Level Security entirely — so RLS isn't providing access control
today. Enabled it anyway with zero policies, which makes Supabase's
PostgREST/client-side API deny all access by default. This costs
nothing and closes off accidental exposure if a table is ever queried
client-side by mistake. Real per-table policies get added if/when a
table is genuinely meant to be queried directly from the client.

---

## 2026-07-01 — shadcn `Field` primitives instead of `Form`/`FormField`

Discovered during implementation: shadcn/ui's registry no longer ships
the classic `Form`/`FormField`/`FormItem`/`FormMessage` components (they
were tightly coupled to React Hook Form's `Controller`). They've been
replaced by an RHF-agnostic `Field` primitive system (`Field`,
`FieldSet`, `FieldLegend`, `FieldLabel`, `FieldGroup`, `FieldError`,
`FieldDescription`, `FieldSeparator`). All forms (login, Company
Settings) are wired to RHF manually via `register()` and
`formState.errors` rather than `Controller`. Also learned the hard way
that a `"use server"` file may only export async functions — Zod
schemas/types shared between a server action and its form now live in
`src/lib/validations/`, not alongside the action.

---

## 2026-07-01 — `OrganizationSettings`, not `Company`, for AMC's own profile

`DOMAIN_MODEL.md`'s `Company` entity is the _customer's_ parent
organization (customer-side data). Phase 1's Company Settings screen
holds _AMC's own_ org profile (tenant/owner data) — a different concept
entirely. Named the table/module `OrganizationSettings` to avoid
collision with the domain model. It's a singleton, enforced in
application code (always upsert the one seeded row) rather than a DB
constraint.

---

## 2026-07-01 — Single `role_id` per user, not many-to-many `user_roles`

RBAC covers Users/Roles/Permissions with one nullable `role_id` FK on
`users`, not a many-to-many join table. Matches how a sales team
actually works (one role per person) and is the simplest correct model
for that. Migrating to many-to-many later is a straightforward
additive change if a real need shows up — not building it speculatively
now (YAGNI).

---

## 2026-07-01 — `permissions` table left empty for Phase 1

The `permissions` and `role_permissions` schema exists, but no
permission codes are seeded and nothing enforces them yet, since there
are no CRUD screens to gate. Permissions get populated incrementally as
each future business module defines what it actually needs to check.

---

## 2026-07-01 — One `DataTable` component instead of a second grid library

"Tables" and "data grids" in the Phase 1 requirements are both covered
by a single reusable `<DataTable>` built on the already-installed
TanStack Table + shadcn table primitives, rather than pulling in a
separate grid package (e.g. AG Grid). Revisit only if a future module
needs something TanStack Table genuinely can't do.

---

## 2026-07-01 — shadcn "sidebar" block for the app shell

Used shadcn's purpose-built enterprise app-shell component
(`SidebarProvider`/`Sidebar`/`SidebarInset`, collapsible, responsive,
keyboard-shortcut-aware) instead of a hand-rolled sidebar. Pulls in
`sheet`, `tooltip`, and `separator` as dependencies, all of which are
useful elsewhere in the design system anyway.

---

## 2026-07-01 — Superseded: Session Pooler instead of direct connection

**Supersedes the decision below.** Supabase's direct-connection host
resolves only to an IPv6 (AAAA) address, and the developer's network
can't route IPv6 traffic (DNS resolves, but the TCP connection times
out) — a common situation on many home/ISP networks. `DATABASE_URL`
now uses Supabase's **Session Pooler** connection string instead
(Project Settings → Database → Connection string → "Session pooler"):
IPv4-compatible, and unlike the Transaction pooler it still supports
prepared statements, so both the app and `drizzle-kit` migrations can
keep using a single `DATABASE_URL` without added complexity. Revisit
if/when IPv6 reachability is no longer a constraint, or if connection
limits under the pooler become a problem at scale.

## 2026-07-01 — ~~Direct-connection `DATABASE_URL`, not the pooled connection~~

Both the app and `drizzle-kit` migrations use Supabase's direct
Postgres connection string rather than the pgbouncer transaction
pooler, to keep Phase 1 simple. Revisit pooling if/when the app moves
to an edge or high-concurrency serverless deployment target — not a
concern yet at this scale.

---

## 2026-07-01 — Centralized Cost Library instead of flat product pricing

Product costing is modeled as a **Cost Library**: independent, reusable
BOM Template / Labor Template / Equipment Template / Overhead Template
entities, composed together by a Product Template, rather than pricing
data living directly on each Product. Estimate Items reference a
Product Template and store a resolved **cost snapshot** at creation/
re-price time rather than a live pointer, so historical estimates stay
accurate even as Cost Library records change. This was a direct
requirement from the domain design review: it's the only structure that
delivers one source of truth for costs, historical pricing accuracy,
per-cost-type margin analysis, and a clean seam for future purchasing
(Material) and inventory integration. See
[DOMAIN_MODEL.md §1.1](./DOMAIN_MODEL.md#11-key-architectural-decision-centralized-cost-library).

---

## 2026-07-01 — Radix component library + "Nova" preset for shadcn/ui

shadcn/ui's CLI now asks which component library (Radix vs Base UI) and
visual preset to scaffold with. Chose **Radix** for broad compatibility
with existing shadcn/ui docs/examples, and **Nova** because it pairs
with Lucide icons, matching the icon library already specified for this
project.

---

## 2026-07-01 — Drizzle ORM for data access, Supabase client for auth only

Rather than using the Supabase JS client's query builder for application
data, Drizzle ORM (via the `postgres-js` driver) talks directly to the
same Postgres database. This gives end-to-end type-safe queries and
version-controlled migrations via `drizzle-kit`. `@supabase/ssr` is used
only for auth/session management (cookie-synced server + browser
clients), per Supabase's official Next.js App Router pattern.

---

## 2026-07-01 — pnpm installed globally via npm, not corepack

pnpm wasn't preinstalled on the dev machine. Chose a plain global install
(`npm install -g pnpm`) over `corepack enable` per user preference.

---

## 2026-07-01 — `src/` directory layout

Used Next.js's `--src-dir` option to keep application code under `src/`,
separate from root-level config files and the `/docs` folder.

---

## 2026-07-01 — Docs scaffolded with real structure, `TBD` for undefined content

Product requirements, database schema, and other product-specific
sections aren't defined yet. Rather than inventing placeholder content,
each doc file was scaffolded with real headings/structure and explicit
`_TBD_` markers for sections that depend on product decisions not yet
made.
