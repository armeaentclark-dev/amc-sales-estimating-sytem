# Architectural Decisions

Short ADR-style log of notable decisions. Newest first.

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
