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

_TBD — testing framework and conventions to be defined before the first
feature module ships._
