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
  app/                  # Routes (App Router): pages, layouts, route handlers
  components/
    ui/                 # shadcn/ui generated components
  lib/
    supabase/           # Supabase browser/server client factories
    db/
      client.ts          # Drizzle client instance
      schema/             # Drizzle table schemas
      migrations/          # drizzle-kit generated SQL migrations
    utils.ts            # Shared utilities (shadcn's cn(), etc.)
  hooks/                 # Shared React hooks
  stores/                # Zustand stores
  types/                 # Shared TypeScript types
docs/                    # Project documentation (this folder)
```

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

## Key decisions

See [DECISIONS.md](./DECISIONS.md) for the rationale behind specific
architectural choices.

## Diagrams

_TBD — add request-flow / data-flow diagrams as modules are built out._
