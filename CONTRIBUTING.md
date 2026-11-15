# Contributing

Thanks for helping. SAS UI is a copy-in component library: what you write in
`packages/registry/src` is exactly what users receive, so readability matters
more than cleverness.

## Setup

```sh
pnpm install
pnpm build:tokens && pnpm build:registry   # generated CSS + registry JSON
pnpm dev                                   # docs app on :5173
pnpm check                                 # typecheck + lint + tests
```

Node 20.19+ and pnpm 11.

## Adding a component

Follow [`docs/COMPONENT-GUIDE.md`](docs/COMPONENT-GUIDE.md). In short, one
component is four files: the source (`ui/<name>.tsx`), a test beside it, a
manifest (`registry/items/<name>.json`) and docs examples
(`apps/docs/src/examples/<name>.tsx`). The registry test fails on:

- a physical direction class (`ml-*`, `pr-*`, `left-*`, `text-left`…) — use logical ones,
- a hex colour in a class — use tokens,
- `any` / `@ts-ignore`,
- an import no registry item provides, a missing test, or a file over 500 lines.

Components must work in Arabic RTL and English LTR, in every preset, in light
and dark, with the keyboard, and pass axe.

## Changing a preset

Presets are data in `packages/tokens/src/presets/*.ts`. `pnpm --filter
@sas-ui/tokens test` checks every text/background pair at WCAG AA in both themes.
To refresh a preset from an app's `tokens-colors.css`, see
[`docs/THEMING.md`](docs/THEMING.md#importing-an-existing-palette).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat(button): …`,
`fix(select): …`, `docs: …`. One logical change per commit. Update
`CHANGELOG.md` for anything user-visible.

## Pull requests

Describe what changed and why, include screenshots for visual changes (light +
dark, RTL + LTR), and make sure `pnpm check` is green.

## Code of conduct

Be kind and constructive. Harassment of any kind is not tolerated.
