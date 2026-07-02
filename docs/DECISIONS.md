# Architectural Decisions

Short ADR-style log of notable decisions. Newest first.

---

## 2026-07-02 — Superseded (Vercel only): Transaction Pooler instead of Session Pooler

**Supersedes "Session Pooler instead of direct connection" below, for
the deployed environment only** — exactly the scenario that decision's
own "revisit" note called out ("if the app moves to an edge or
high-concurrency serverless deployment target" / "if connection limits
under the pooler become a problem at scale").

First Vercel deployment failed at runtime (not build time) with
`XX000: max clients reached in session mode - max clients are limited
to pool_size: 15`. Session Pooler holds one dedicated Postgres
connection open for the entire life of each client connection — fine
for a single long-running local dev process, but each concurrent
Vercel serverless function invocation opens its own connection, and a
handful of concurrent requests exhausts a 15-connection pool.

Fixed by switching Vercel's `DATABASE_URL` environment variable to
Supabase's **Transaction Pooler** (same host, port `6543` instead of
`5432`), which releases each connection back to the pool after every
query/transaction instead of holding it for the session. No code
change needed — `src/lib/db/client.ts` already passes
`{ prepare: false }` to the postgres.js client, which happens to be
the one requirement transaction-pooler mode has (no prepared
statements). **Local development stays on the Session Pooler** — a
single persistent dev server process doesn't hit this failure mode,
so there's no reason to change what already works there. This means
`DATABASE_URL` now legitimately differs by environment: Session Pooler
in `.env.local`, Transaction Pooler in Vercel's project settings.

---

## 2026-07-02 — Vitest, reusing the dev DB for pricing engine tests

Chose **Vitest** for the first real test suite (matches the `rtk`
tooling already documented in the user's global CLAUDE.md, ESM-native,
fast). Scoped the first pass to `src/lib/estimating/pricing-engine.ts`
only — the highest-stakes code (computes real quote numbers) and the
only code this session had already hand-verified.

The engine queries the DB directly rather than being pure functions,
so testing it needs real rows. Chose to **reuse the dev Supabase DB**
rather than provision a separate test database: no new infrastructure
(a second Supabase project, or local Postgres via Docker, is a real
setup cost this session didn't take on), at the price of tests
seeding/cleaning up their own fixtures in the same database developers
work in day-to-day. Mitigated with a `__vitest__`-prefixed naming
convention (easy to spot/grep if cleanup ever fails) and `afterAll`
deletion in FK-safe order, verified to leave zero residue. Revisit if
a failed test run ever actually leaves orphaned rows in practice, or
once the project is far enough along to justify a dedicated test DB.

---

## 2026-07-02 — Two ambiguous domain-model formulas, interpreted and confirmed

Two spots in `DOMAIN_MODEL.md` §3.6 didn't have one unambiguous
reading. Both were resolved in favor of internal consistency, verified
against hand-calculated test data, and **confirmed correct by the
user on 2026-07-02** — no code changes needed:

1. **`flat_per_unit` overhead**: the formula literally reads
   `rate × quantity`, but `Extended Price = Net Price × Quantity`
   means quantity must only be applied _once_, and every other cost
   component (Material/Labor/Equipment Cost) is computed **per unit**
   with no quantity multiplication. Applying `rate × quantity` again
   inside Overhead Cost would double-count. Implemented `flat_per_unit`
   as "the rate already **is** the per-unit overhead cost" — i.e.
   Overhead Cost contribution = `rate`, not `rate × quantity`. Verified:
   `computeEstimateItemPricing` at quantity=1 and quantity=3 returns
   the _same_ `totalDirectCost` (correctly per-unit) with
   `extendedPrice` scaling linearly.
2. **Markup Rule "most-specific wins" ordering**: §1.2 says Markup
   Rule is "attachable at Product Category, Product Template, or
   Customer level (most-specific wins)" but doesn't rank those three
   against each other. Implemented Customer as most specific (a
   negotiated deal beats a product default), then Product Template,
   then Product Category as the coarsest fallback — symmetric with how
   §3.7/§3.8's material/labor hierarchies already put "customer-specific
   negotiated price" above catalog-level pricing.

Both live in `src/lib/estimating/pricing-engine.ts`
(`computeProductTemplateCost`'s overhead loop, `resolveMarkup`'s scope
ordering) with inline comments pointing back here.

---

## 2026-07-02 — `EST-YYYY-NNNNNN` uses a per-year counter table, not a sequence

Every other numbered entity (`CUS-`, `MAT-`, `PRT-`, etc.) uses a flat
global Postgres `SEQUENCE`, but Estimate numbers reset every calendar
year (`DOMAIN_MODEL.md` §4) and a plain `SEQUENCE` has no built-in
reset. `estimate_number_counters(year, last_number)` +
`generate_estimate_number()` upserts the current year's row
atomically (`ON CONFLICT ("year") DO UPDATE ... RETURNING`), which
serializes concurrent callers via Postgres's row-level lock the same
way `nextval()` does — satisfying §4's "never derived from `count(*)`"
requirement. Verified: two back-to-back calls return sequential
numbers, and a separately-tracked prior-year row stays independent.

---

## 2026-07-02 — Estimate Status is a real table, not an enum

Every other fixed-value classification in this codebase (`customer_status`,
`cost_type`, `markup_scope_type`, etc.) is a Postgres enum, but Estimate
Status needed `is_terminal` and `allowed_next_states` metadata
alongside each code (§3.1/§3.4) — an enum can't carry that. Every
status-transition server action (`transitionRevision` in
`src/lib/actions/estimates.ts`) checks `allowed_next_states` before
applying a change, so the seeded table (not scattered `if` statements)
is the single source of truth for the state machine.

---

## 2026-07-02 — Cost snapshot detail stored as JSONB, not one column per cost line

`estimate_items` has real numeric columns for the aggregate totals
(needed for sums/sorting/display) but stores the itemized resolution
trail — which BOM/labor/equipment/overhead line resolved to what cost,
via which pricing-hierarchy level — as a single `cost_snapshot_detail`
jsonb column. A Product Template's line count is unbounded and
variable per template, so a fixed set of columns doesn't fit; jsonb
keeps the full audit trail queryable without a variable-width schema.

---

## 2026-07-02 — Single approval satisfies the InReview → Approved transition (MVP)

`DOMAIN_MODEL.md` §3.3 describes multi-level approval ("e.g. sales
manager, then finance, above a higher threshold") as an example, not
a concrete rule for how many approvers or which roles are required at
which thresholds — `approval_thresholds` (built in Phase 7) only
carries margin-floor/value-ceiling numbers, not an approval-count or
role requirement. Building a configurable N-approvals-required engine
would be speculative given that gap. Current behavior: submitting for
review computes and displays which thresholds (if any) are breached as
context for the approver, but a single `recordApprovalAction` decision
moves the revision to Approved or Rejected. Revisit if/when the
threshold entity grows a "required approval count/role" field.

---

## 2026-07-02 — Manual cost override replaces the whole item cost, not per BOM-line

§3.7/§3.8 list "manual override entered directly on the Estimate Item"
as level 1 of the material _and_ labor pricing hierarchies separately,
which could be read as allowing an override on individual BOM/labor
lines within a Product Template's cost breakdown. Implemented it at
the Estimate Item level instead — `manual_cost_override` replaces the
entire computed `total_direct_cost` — since per-line overrides would
need UI to edit individual resolved BOM/labor/equipment lines inside
an Estimate Item, a materially larger feature than the rest of Phase 8.
Revisit if a real workflow needs to override just one input (e.g. one
negotiated material price) while still computing the rest normally.

---

## 2026-07-02 — Attachments are a filename + URL, not a real upload widget

`attachments.file_url` expects a URL; the MVP form just takes a
pasted filename + URL rather than a drag-and-drop upload. A real
upload would need a dedicated Supabase Storage bucket provisioned out
of band (the same manual setup step `organization-assets` needed for
the Company logo in Phase 1) — out of scope to provision blind in this
pass. Swap in the same upload pattern `company-settings-form.tsx`
already uses once a bucket exists.

---

## 2026-07-02 — Polymorphic `scope_id` columns have no FK constraint

`markup_rules.scope_id`, `discount_rules.scope_id`, and
`customer_pricing_agreements.scope_id` each point at a different
table depending on the row's `scope_type` (e.g. a Markup Rule's scope
is a Product Category, a Product Template, _or_ a Customer). Postgres
has no native polymorphic FK, so these columns are plain `uuid` with
no constraint — integrity is enforced at the application layer (Zod +
the scope-type-driven `<Select>` in each form). This mirrors a pattern
the domain model already uses for Attachment/Note's `attached_to`.
Contrast with `tax_rules.product_category_id`, which always points at
exactly one table and does get a real FK.

---

## 2026-07-02 — Discount Rule's "estimate" scope is schema-only for now

`discount_rules.scope_type` includes `estimate` per
[DOMAIN_MODEL.md §1.2](./DOMAIN_MODEL.md#12-entity-catalog), but the
`Estimate` table doesn't exist until the next phase. The enum value
exists (schema matches the domain model exactly) but the create form
only offers "Customer" as a scope for now — an estimate-scoped
discount genuinely can't be created before Estimates exist. Revisit
the form once the Estimate Builder ships.

---

## 2026-07-02 — Labor Process has no `default_labor_rate_id`

`DOMAIN_MODEL.md` §1.2 lists `default_labor_rate_id` as a Labor
Process attribute, but Labor Rate also has a `labor_process_id` FK
back to Labor Process — a maintained "default" pointer would be a
circular FK for no real benefit, since §3.8's costing hierarchy
already resolves "the currently effective rate" by querying
`effective_date`/`expires_date`, not by an explicit designation.
Omitted the column; "current rate" is computed at read time (see
`currentRate()` in `labor-panel.tsx`, and the same logic will be
needed again in the Estimate Item pricing engine — worth extracting to
a shared helper when that's built).

---

## 2026-07-02 — Cost Library sequences created before their tables

Phase 2's `customer_number` pattern created the table first, then a
follow-up migration added the sequence/function and retrofitted the
column default (`0002` → `0003` → `0004`, three migrations because the
need for a Drizzle-side `.default()` declaration was discovered after
the fact). For Phase 4, declared `.default(sql\`generate_x_number()\`)`
directly in the schema from the start, which meant the sequence/
function migration had to be **generated and ordered before** the
table-creation migration instead of after. Pattern going forward: any
new sequence-backed number column should get its sequence/function
migration authored first, table migration second — avoids the
retrofit step Phase 2 needed.

---

## 2026-07-02 — Salesperson fields on `users`, not a separate table

`DOMAIN_MODEL.md` §1.2 already calls Salesperson "a system User" and
§6.2 recommends a real `User`/`Role` entity, which Phase 1's RBAC
schema already provides. Added `employee_code`, `region`, and
`commission_rate` as nullable columns directly on `users` rather than
a `salespeople` table — there's no independent Salesperson identity or
lifecycle to model beyond "a User who happens to have these fields
set." Revisit only if Salespeople need attributes that don't make
sense on every user (unlikely, given the domain model's own framing).

---

## 2026-07-02 — UOM conversion factors deferred

`DOMAIN_MODEL.md` §6.1 recommends a UOM entity "with conversion
factors." Built the lookup table (`code`, `name`) but not conversion
arithmetic — nothing in the schema yet does cross-unit quantity math
(that starts with BOM Template Lines in a later phase). Adding
conversion factors now would be speculative; revisit when Material/BOM
costing actually needs to convert between units.

---

## 2026-07-02 — Customer/Contact/Address schema kept in one file

Split into three files initially (`customers.ts`, `contacts.ts`,
`addresses.ts`), each importing the others to define `relations()` on
both sides of the FK. This is a genuine circular import: `relations()`
dereferences its target table argument synchronously, and
`customers.ts` ↔ `contacts.ts`/`addresses.ts` each import the other,
so whichever loads second hits its cross-file table reference before
that binding is initialized — `Cannot access 'customers' before
initialization` at runtime. Consolidated all three tables and their
relations into a single `customers.ts`, the same pattern already used
for RBAC (`roles`/`permissions`/`role_permissions`/`users` all live in
`users.ts`). Rule of thumb going forward: entities with bidirectional
`relations()` to each other belong in the same schema file unless
there's a strong reason to split.

---

## 2026-07-02 — `customer_number` via a Postgres sequence, hand-written default

`CUS-NNNNNN` (per [DOMAIN_MODEL.md §4](./DOMAIN_MODEL.md#4-numbering-standards))
is generated by a `generate_customer_number()` SQL function backed by
a plain sequence, applied via a hand-written migration
(`0003_customer_number_sequence.sql`), the same pattern as
`0001_auth_trigger.sql` for SQL Drizzle can't express directly. Chosen
over app-level generation (query max + increment under a lock) because
the numbering spec is a flat global sequence with no per-branch/
per-year rules — a DB sequence is simpler and atomic by construction.
Also had to declare the same default in the Drizzle schema
(`.default(sql\`generate_customer_number()\`)`) and regenerate — a
default set only via hand-written SQL is invisible to Drizzle's
generated insert types, which then wrongly require `customerNumber` on
every insert.

---

## 2026-07-02 — Company (parent org rollup) entity deferred from Phase 2 v1

`DOMAIN_MODEL.md`'s `Company` entity (a customer's optional parent
organization, for multi-site rollups) is out of scope for the first
Customers pass. `customers.company_id` exists as a nullable uuid
column with no FK/table/CRUD behind it yet, so adding Company later
doesn't require another migration to add the column — just the table,
FK, and UI. Deferred because nothing in the current requirements needs
multi-site rollups yet, and building it speculatively would roughly
double this phase's scope.

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
