# Development Roadmap

## Phase 0 — System Foundation ✅

- Next.js 15 project scaffold (TypeScript, App Router, Tailwind, ESLint)
- shadcn/ui, Supabase clients, Drizzle ORM wiring
- Tooling: Prettier, Husky, lint-staged
- `/docs` structure
- Initial git commit

## Phase 0.5 — Domain Design ✅

- Full business domain model, ERD, business rules, numbering standards,
  and ERP integration boundaries documented in
  [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
- Architectural decision: centralized Cost Library (see
  [DECISIONS.md](./DECISIONS.md))
- Pending: incorporate recommended additions (UOM, User/Role, Customer
  Pricing Agreement, Approval Threshold) before schema implementation

## Phase 1 — TBD

_To be planned once product requirements
([PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)) are further
defined, and the Phase 0.5 recommendations are resolved. Likely
candidates: Supabase project provisioning + auth flow, User/Role +
Customer/Contact/Address schema, Cost Library schema (Material, Labor
Process/Rate, Equipment, templates), first estimating workflow._

## Later phases

_TBD_
