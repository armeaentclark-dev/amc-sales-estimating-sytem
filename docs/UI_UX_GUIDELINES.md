# UI/UX Guidelines

## Component library

Built on [shadcn/ui](https://ui.shadcn.com) (Radix primitives, "Nova"
preset, neutral base color, Lucide icons). Configuration lives in
`components.json`. Generate new components via:

```bash
pnpm dlx shadcn@latest add <component>
```

Prefer composing shadcn/ui primitives over hand-rolled components, and
keep generated components in `src/components/ui/` unmodified where
possible — put app-specific composition in `src/components/`.

## Styling

- Tailwind CSS v4, utility-first. Avoid custom CSS files outside of
  `src/app/globals.css` (design tokens/CSS variables) unless there's a
  concrete need.
- Class ordering is auto-sorted by `prettier-plugin-tailwindcss` — don't
  hand-order classes.

## Forms

- React Hook Form for form state, Zod for schema validation, wired via
  `@hookform/resolvers`. Validation schemas should be colocated with the
  form or in a shared `schemas/` file if reused.

## Tables

- TanStack Table for any data grid / sortable / filterable table needs,
  styled with shadcn/ui table primitives.

## Accessibility

- Radix primitives (via shadcn/ui) provide accessible behavior by
  default (focus management, ARIA attributes, keyboard navigation) —
  don't bypass them with custom implementations.

## Visual design

_TBD — brand colors, typography scale, spacing conventions to be defined
as the UI takes shape._
