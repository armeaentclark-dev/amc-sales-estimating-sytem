# Changelog

All notable changes to this project will be documented in this file.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

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
