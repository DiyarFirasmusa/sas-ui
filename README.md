# SAS UI

An **own-the-code** React component library for dashboards that are right-to-left
first. Base UI primitives, Tailwind CSS v4, a real token system with switchable
presets, light/dark, Arabic + English, and a CLI that copies readable source into
your project — in the spirit of shadcn/ui, extended for data-heavy admin apps.

> Working name `sas-ui`; the scope (`@sas-ui/*`) and CLI name are easy to change
> in one pass (see [Renaming](#renaming)).

## Why

- **You own the code.** `sas-ui add button` copies `button.tsx` (and what it needs)
  into `src/components/ui`. No runtime dependency, edit anything, `sas-ui diff` shows drift.
- **Accessible by construction.** Behaviour from [`@base-ui/react`](https://base-ui.com);
  every component ships with Testing Library + axe tests.
- **RTL is not a patch.** Logical CSS only (enforced by a test), mirrored icons,
  inputs that follow the typed language, Latin digits by default, labels in `ar` and `en`.
- **Theme as data.** ~78 colour tokens, four presets (`neutral`, `wine-lapis`,
  `inventory`, `hr`), contrast-checked to WCAG AA, switchable at runtime or by CLI.
- **Wider than shadcn.** Data table (server paging/sort/filters, bulk select,
  mobile cards), metadata-driven filter bar, tree picker, async combobox, date /
  range / time pickers, file dropzone, app shell, charts, rich text, command palette, resizable panels…

## Quick start

Requires a Vite + React 19 + TypeScript + Tailwind v4 project.

```sh
npx sas-ui init --preset wine-lapis --all-presets
npx sas-ui add button input select dialog data-table
```

```tsx
import { Button } from '@/components/ui/button';

export function Save() {
  return <Button loading={isSaving}>Save</Button>;
}
```

```html
<html lang="ar" dir="rtl" data-preset="wine-lapis">
```

Whole pages come as **blocks**: `sas-ui add dashboard-01 list-page-01 shell-01 login-02` (see the Blocks section
of the docs app, with desktop/tablet/mobile previews).

Other commands: `sas-ui list`, `sas-ui diff [component]`, `sas-ui theme set hr`,
`sas-ui add --all`. See [`packages/cli`](packages/cli) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository

| Path                | What                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tokens`   | presets → CSS, contrast checks, runtime switcher                                                                                                |
| `packages/registry` | component sources, tests, manifests, registry builder                                                                                           |
| `packages/cli`      | the `sas-ui` command                                                                                                                            |
| `apps/docs`         | preview site: every component × preset × light/dark × RTL/LTR                                                                                   |
| `docs/`             | [Architecture](docs/ARCHITECTURE.md) · [Theming](docs/THEMING.md) · [Component guide](docs/COMPONENT-GUIDE.md) · [Migration](docs/MIGRATION.md) |

## Develop

```sh
pnpm install
pnpm build:tokens && pnpm build:registry
pnpm dev            # docs app
pnpm check          # typecheck + lint + all tests
pnpm build && pnpm e2e:cli   # CLI end-to-end against a scratch Vite app (needs network)
```

## Renaming

The name appears in: package scopes (`@sas-ui/*`), the CLI binary (`sas-ui`),
`sas-ui.json`, storage keys (`sas-ui:*` in `packages/tokens/src/apply-preset.ts`
and the theme provider) and CSS folder `styles/sas-ui`. A repo-wide search for
`sas-ui` finds every place.

## Status

Pre-1.0. See [CHANGELOG.md](CHANGELOG.md). Not yet published to npm.

## License

[MIT](LICENSE)
