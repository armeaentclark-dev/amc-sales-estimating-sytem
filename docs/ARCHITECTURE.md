# Architecture

## Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix, Nova preset), Lucide Icons
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM (`postgres-js` driver)
- **Auth**: Supabase Auth via `@supabase/ssr`
- **Forms/validation**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Client state**: Zustand
- **Package manager**: pnpm
- **Deployment**: Vercel

## Folder structure

```
src/
  app/
    (auth)/               # Route group: unauthenticated pages (no shared shell)
      login/                # Login page (no registration — users managed internally)
    (app)/                 # Route group: authenticated app shell
      layout.tsx             # Auth check + sidebar/top-nav/user-menu shell
      loading.tsx             # Segment-wide loading skeleton
      error.tsx                # Segment-wide error boundary
      page.tsx                   # Dashboard placeholder
      settings/company/          # Company (Organization) Settings screen
    global-error.tsx        # Top-level error boundary (own <html>/<body>)
    layout.tsx               # Root layout: ThemeProvider, Toaster
  components/
    ui/                   # shadcn/ui generated components
    layout/                # App shell: sidebar, top-nav, user-menu, theme toggle/provider
    data-table.tsx, empty-state.tsx, page-header.tsx,
    status-chip.tsx, search-bar.tsx   # Reusable design-system composites
  lib/
    supabase/             # Supabase browser/server client factories
    supabase/middleware.ts  # updateSession() — session refresh + route protection
    actions/                # Server actions ("use server"), e.g. auth, organization-settings
    validations/             # Zod schemas/types shared between server actions and forms
    db/
      client.ts          # Drizzle client instance
      schema/             # Drizzle table schemas
      migrations/          # drizzle-kit generated SQL migrations + hand-written raw SQL
      seed.ts               # pnpm db:seed — default roles + organization_settings row
    utils.ts            # Shared utilities (shadcn's cn(), etc.)
  middleware.ts          # Next.js middleware entry point (calls updateSession)
  hooks/                 # Shared React hooks
  stores/                # Zustand stores
  types/                 # Shared TypeScript types
docs/                    # Project documentation (this folder)
```

**Note on `lib/validations/`**: Zod schemas used by both a server action and a
client form must live outside any `"use server"` file — Next.js only allows
`"use server"` files to export async functions, not schema/type constants.

## Data access pattern

- **Auth** goes through `@supabase/ssr` clients (`src/lib/supabase/server.ts`
  for Server Components/Route Handlers, `src/lib/supabase/client.ts` for
  Client Components), following Supabase's official Next.js App Router
  pattern (cookie-based session sync).
- **Application data** (quotes, pricing, customers, etc.) is accessed
  through Drizzle ORM against the same Postgres database, rather than
  through the Supabase JS client's query builder. This keeps queries
  type-safe end-to-end and keeps schema/migrations in version control via
  `drizzle-kit`.
- Row Level Security (RLS) policies in Supabase remain the authorization
  boundary for any data also reachable via the Supabase client (e.g.
  storage, realtime); Drizzle queries running server-side should apply
  equivalent authorization checks in application code.

## Authentication & authorization

- **Supabase Auth** is the identity provider. There is no self-service
  registration — users are created manually in the Supabase dashboard
  (Authentication → Users → Add user) and provisioned internally.
- **Session handling** follows Supabase's official SSR pattern via
  `@supabase/ssr`: cookie-synced browser and server clients
  (`src/lib/supabase/client.ts`, `server.ts`).
- **Route protection is layered**:
  1. `src/middleware.ts` runs on every request (excluding static assets)
     and calls `updateSession()` (`src/lib/supabase/middleware.ts`),
     which refreshes the session and redirects unauthenticated requests
     to `/login?next=<path>` for any non-public path. Authenticated users
     hitting `/login` are redirected to `/`.
  2. `src/app/(app)/layout.tsx` performs a second, server-side
     `supabase.auth.getUser()` check as defense-in-depth before rendering
     the shell, and loads the current user's profile (`public.users`
     joined to `roles`) for the user menu.
- **Profile / RBAC schema** (`src/lib/db/schema/users.ts`):
  `roles`, `permissions`, `role_permissions` (composite PK), and
  `users` — a `public.users` profile table extending `auth.users`
  (one row per Supabase Auth user, linked 1:1 via a Postgres trigger —
  see `src/lib/db/migrations/0001_auth_trigger.sql`). `users.role_id` is
  a single nullable FK to `roles` (not a many-to-many `user_roles`
  table) — see [DECISIONS.md](./DECISIONS.md) for rationale. No CRUD UI
  exists yet for roles/permissions/users; that's schema-and-seed only
  for Phase 1. See [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) for full
  column definitions.
- **Logout** is a server action (`src/lib/actions/auth.ts`,
  `signOutAction`) invoked from the user menu.

## Design system

Reusable UI is split into two layers under `src/components/`:

- **shadcn/ui primitives** (`components/ui/`) — generated via
  `pnpm dlx shadcn@latest add <component>`, Radix + "Nova" preset (see
  [DECISIONS.md](./DECISIONS.md)). Forms use shadcn's newer **`Field`
  primitive system** (`Field`, `FieldSet`, `FieldLegend`, `FieldLabel`,
  `FieldGroup`, `FieldError`, `FieldDescription`, `FieldSeparator`),
  wired manually to React Hook Form (`register` / `formState.errors`).
  This replaces the older `Form`/`FormField` pattern (which was coupled
  to RHF's `Controller`) — shadcn's registry no longer ships that
  component. See [DECISIONS.md](./DECISIONS.md) for details.
- **Composed components** (`components/*.tsx` and `components/layout/`)
  — built on top of the primitives so every future module gets
  consistent spacing, typography, and behavior for free:
  - `DataTable` — generic TanStack Table grid (sorting, client
    pagination, empty state) used for every list/grid screen instead of
    a second grid library.
  - `EmptyState`, `PageHeader`, `StatusChip`, `SearchBar` (debounced).
  - `layout/app-sidebar.tsx`, `top-nav.tsx`, `user-menu.tsx`,
    `theme-toggle.tsx`, `theme-provider.tsx` — the app shell, built on
    shadcn's "sidebar" block (collapsible, responsive,
    `SidebarProvider`-based).
- **Loading / error conventions**: every route segment gets its own
  `loading.tsx` (Skeleton-based) and `error.tsx` (`EmptyState` + retry
  button), following the pattern established in `src/app/(app)/`; a
  root `global-error.tsx` is the last-resort fallback.

## Business domain

The full business entity model, ERD, business rules, numbering
standards, and future ERP integration boundaries are documented in
[DOMAIN_MODEL.md](./DOMAIN_MODEL.md). Notably, product costing is built
around a centralized **Cost Library** (BOM/Labor/Equipment/Overhead
Templates composed by a Product Template) rather than flat per-product
pricing — see DOMAIN_MODEL.md §1.1 for why.

## Key decisions

See [DECISIONS.md](./DECISIONS.md) for the rationale behind specific
architectural choices.

## Diagrams

_TBD — add request-flow / data-flow diagrams as modules are built out._
