# Coding Standards

## Language & tooling

- TypeScript in strict mode; avoid `any` — prefer proper types or
  `unknown` with narrowing.
- Package manager: **pnpm** (not npm or yarn).
- Formatting: Prettier (`.prettierrc`), auto-run on commit via
  Husky + lint-staged. Don't hand-format — run `pnpm format` if needed.
- Linting: ESLint (`next/core-web-vitals`, `next/typescript`,
  `prettier`). Run `pnpm lint`.
- Type checking: `pnpm typecheck`.

## Git

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, etc.).
- Pre-commit hook (Husky) runs `lint-staged` (ESLint + Prettier on
  staged files) — don't bypass with `--no-verify` without good reason.

## Project structure conventions

- Server-only code (DB access, secrets) stays in `src/lib/db/` and
  `src/lib/supabase/server.ts` — never imported into Client Components.
- Shared client-safe utilities go in `src/lib/utils.ts` or `src/hooks/`.
- Zustand stores live in `src/stores/`, one store per concern.
- Prefer Server Components by default; mark `"use client"` only where
  interactivity requires it.

## Validation

- Any data crossing a trust boundary (form submission, route handler
  input) must be validated with a Zod schema before use.

## Testing

- Framework: **Vitest** (`pnpm test` to run once, `pnpm test:watch`
  for watch mode). Config in `vitest.config.ts`; `vitest.setup.ts`
  loads `.env.local` before tests run.
- Tests that hit the database (e.g. the pricing engine, which queries
  the DB directly rather than being pure) run against the **dev
  Supabase DB** — there's no dedicated test database yet. Seed
  fixtures with a unique, greppable prefix (e.g. `__vitest__`) in
  `beforeAll` and delete them in `afterAll`, in FK-safe order. See
  `src/lib/estimating/pricing-engine.test.ts` for the pattern, and
  [DECISIONS.md](./DECISIONS.md) for why this approach was chosen over
  provisioning a separate test database.
- Import `describe`/`it`/`expect`/etc. explicitly from `"vitest"`
  rather than relying on injected globals — keeps ESLint happy without
  a test-specific config.
