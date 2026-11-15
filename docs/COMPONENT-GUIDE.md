# Component guide

How a component is written, tested and registered in `packages/registry`.
Read one finished component first: `ui/button.tsx`, `ui/field.tsx`,
`ui/dialog.tsx` and `ui/select.tsx` are the reference examples.

## Where things go

| What                         | Path                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Component source             | `packages/registry/src/ui/<name>.tsx` (multi-file: `<name>.tsx`, `<name>-row.tsx`, … all flat, kebab-case) |
| Pure logic (no JSX)          | `packages/registry/src/lib/<topic>.ts`                                                                     |
| Hooks                        | `packages/registry/src/hooks/use-<topic>.ts`                                                               |
| Test (required)              | beside the source: `<name>.test.tsx`                                                                       |
| Registry manifest (required) | `packages/registry/registry/items/<name>.json`                                                             |
| Docs examples (required)     | `apps/docs/src/examples/<name>.tsx`                                                                        |

No barrels, no `index.ts`. A file never imports its siblings relatively:
always the aliases `@/components/ui/<file>`, `@/lib/<file>`, `@/hooks/<file>`,
`@/test/<file>`. The CLI rewrites them to the user's configured aliases.

### Manifest

```json
{
  "name": "radio-group",
  "type": "ui",
  "category": "form",
  "title": "Radio group",
  "description": "One-line summary.",
  "files": ["ui/radio-group.tsx"],
  "tier": "core"
}
```

`category`: foundation | form | overlay | navigation | data | feedback | layout | display.
`tier`: `core` (default) or `extra` (heavy dependency such as recharts, tiptap).
`dependencies` and `registryDependencies` are derived from your imports by
`pnpm --filter @sas-ui/registry build`; npm packages must already be in
`packages/registry/package.json` (do NOT edit that file — if you truly need a new
package, write the small helper yourself or report it in your summary).

### Docs examples

```tsx
import { Button } from '@/components/ui/button';
import type { Example } from '../example-types';

export const examples: Example[] = [{ title: 'Default', render: () => <Button>Save</Button> }];
```

Show the realistic variants and states (disabled, invalid, loading, empty,
long Arabic text where it matters). Labels in examples may be English; they
render under the docs app's locale switch, so prefer the component's own
localised defaults.

## Rules (the registry test and review enforce these)

1. **Built on `@base-ui/react`** wherever a primitive exists (no Radix, no
   headless-ui). Use its `render` prop for composition; our `Slot` is only for
   `asChild`-style wrappers.
2. **Strict TypeScript**: no `any`, no `as` to silence the compiler, no
   `@ts-ignore`. Narrow `unknown`; use type predicates. Props are exported
   interfaces named `<Component>Props` when callers need them.
3. **Logical CSS only** (`ps-*`, `me-*`, `start-*`, `text-start`, `border-s`,
   `rounded-e-*`). Physical `left/right/ml/pr…` classes fail the registry test.
   Mirror directional icons (our icons do it via `rtl:-scale-x-100`).
   Free-text inputs follow the typed language; Latin-only content is `dir="ltr"`.
4. **Tokens, not colours**: `bg-surface`, `text-text-muted`, `border-stroke`,
   `bg-primary text-primary-foreground`, status `bg-tag-green-container
   text-tag-green`, role spacing `gap-field p-card`, type ramp `text-b1 text-h3`.
   No hex values, no arbitrary colours. Type-ramp utilities already set size,
   line-height and weight: never add `font-*`/`leading-*` beside them.
5. **No hardcoded strings.** Every user-visible or screen-reader string is a
   prop with an ar/en default through `useLabels()` (see `dialog.tsx`,
   `spinner.tsx`). Keep the messages object local to the component file.
6. **Accessibility**: real roles/labels, visible focus (`focus-visible:ring-*`),
   keyboard operation, `aria-invalid`/`aria-busy` where relevant, ≥44px touch
   targets on mobile where the control is primary, respect
   `motion-reduce:`. Every component test includes an axe check
   (`expectNoA11yViolations`).
7. **States**: loading, error, empty (and disabled) are designed, not skipped.
8. **Form controls** work inside `Field` and react-hook-form (forward
   `ref`, `name`, `onBlur`, `aria-invalid`).
9. Files stay under 500 lines. Comments explain _why_. No dead code, no
   `console.log`, no TODOs.
10. Copyable: no cross-component magic, no global registries, no CSS files per
    component — Tailwind utilities in the file (extract a `variants()` when a
    component has variants).

## Direction

Base UI reads text direction from its own `DirectionProvider`, not from
`<html dir>`. `LocaleProvider` (and the `ThemeProvider`) wrap their children in
one, so popups, sliders and arrow-key navigation mirror correctly in Arabic.
Always render library components under one of them (the docs app and
`renderWithLocale` do), and keep `lib/locale.tsx` as the single place that
decides direction.

## Tests

Vitest + Testing Library + user-event + axe, in jsdom (`src/test/setup.ts`
stubs ResizeObserver/matchMedia/scrollIntoView). Per component at minimum:
renders and behaves (user-event), keyboard, disabled/invalid states, an
Arabic/RTL case where the component has direction logic or labels
(`renderWithLocale(<X />, { locale: 'ar' })`), and `expectNoA11yViolations`.
jsdom has no layout: do not assert pixel positions; floating popups are found
by role after opening.

```sh
pnpm --filter @sas-ui/registry exec vitest run src/ui/<name>      # your tests
pnpm --filter @sas-ui/registry exec tsc --noEmit                   # types (read only the errors in your files)
pnpm --filter @sas-ui/registry exec vitest run registry            # manifests, imports, house rules (run when done)
```
