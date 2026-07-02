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

## Phase 1 — Platform Foundation ✅

Auth (Supabase, no self-registration), app shell, RBAC schema
(`roles`/`permissions`/`role_permissions`/`users`), Company
(`organization_settings`) settings screen, shadcn-based design system
(`DataTable`, `EmptyState`, `PageHeader`, `StatusChip`, `SearchBar`).

## Phase 2 — Customers ✅

Customer + Contact + Address. Company (parent org rollup) deferred —
see [DECISIONS.md](./DECISIONS.md).

## Phase 3 — Reference Data ✅

UOM, Cost Category, Material Category, Product Category. Salesperson
fields added to `users` rather than a separate table.

## Phase 4 — Cost Library Core ✅

Material, Labor Process + effective-dated Labor Rate, Equipment.

## Phase 5 — Cost Library Templates ✅

BOM/Labor/Equipment/Overhead Template + their line tables — the
reusable "recipes" a Product Template composes.

## Phase 6 — Products ✅

Product Template (composes the four sub-templates + a future markup
rule), Product.

## Phase 7 — Pricing Rules ✅

Markup Rule, Discount Rule, Tax Rule, Customer Pricing Agreement
(§6.3 recommendation), Approval Threshold (§6.4 recommendation).

## Phase 8 — Estimate Builder ✅

Estimate Status (seeded state machine), Estimate (`EST-YYYY-NNNNNN`,
year-resetting), Estimate Revision, Estimate Item (full cost
snapshot), Approval, Attachment, Note. Pricing/margin calculation
engine implementing the material/labor cost-resolution hierarchies and
margin math, verified against hand-calculated values. Full lifecycle
(Draft → InReview → Approved → Sent → Won → Converted, plus
Rejected/Lost/Expired/Voided) wired into the UI and browser-verified
end to end.

## Later phases

The full `DOMAIN_MODEL.md` entity catalog is now implemented. Open
items flagged during Phase 8 worth a dedicated pass rather than a
quick follow-up:

- Two formula ambiguities interpreted during the pricing engine build
  (`flat_per_unit` overhead, Markup Rule scope precedence) — see
  `DECISIONS.md`, worth confirming against the original domain intent.
- Real Attachment file upload (currently filename+URL entry) once a
  Supabase Storage bucket is provisioned.
- Multi-level/role-based approval workflow, if a single approval
  decision per revision turns out to be insufficient in practice.
- ERP integration boundary (§5 of `DOMAIN_MODEL.md`) — everything
  marked "Shared with ERP" is still standalone; no sync exists yet.
- UOM conversion arithmetic (deferred since Phase 3 — nothing yet
  mixes units within a calculation).
