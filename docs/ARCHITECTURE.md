# Architecture

SAS UI is an _own-the-code_ React component library in the spirit of shadcn/ui,
extended for dashboards that must be right-to-left first. This document says
what the pieces are and why they are cut the way they are.

## Goals

1. **Own the code.** Components are copied into a project as plain TypeScript;
   there is no runtime dependency on SAS UI. A project can edit any line.
2. **Accessible primitives.** Behaviour comes from `@base-ui/react` (the stack the
   existing dashboards already use) — no Radix, no hand-rolled focus traps.
3. **Theme as data.** Colour is a token contract plus _presets_ (data), switchable
   at runtime and by CLI, validated for WCAG AA by tests.
4. **RTL first.** Logical CSS only, direction-aware icons, Arabic labels by
   default alongside English, Latin digits by default.
5. **Wider than shadcn.** Data table, filter bar, tree picker, date/time pickers,
   app shell, charts, rich text — the pieces an ERP dashboard actually repeats.

## Monorepo layout

```text
packages/
  tokens/     @sas-ui/tokens   presets (data) → generated CSS, contrast checks, runtime switcher
  registry/   @sas-ui/registry component sources + tests + manifests → registry JSON (private)
  cli/        @sas-ui/cli      `sas-ui init | add | diff | list | theme`, zero runtime deps
apps/
  docs/       @sas-ui/docs     Vite preview site rendering the registry sources live
docs/                          architecture, guides, migration
scripts/                       end-to-end CLI check against a scratch Vite app
```

### Why a registry + CLI _and_ packages

| Concern                                    | Delivered as                                    | Why                                                                                                                                                                                                                                                                                           |
| ------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components                                 | **Copied source** (registry + CLI)              | Ownership, no version lock-in, projects diverge on purpose (the three dashboards will), `diff` shows drift                                                                                                                                                                                    |
| Tokens / presets                           | **Package** (`@sas-ui/tokens`) _and_ copied CSS | The palette is shared infrastructure that should update centrally (the wine-lapis palette is being redesigned right now), but a project must also be able to freeze it. The CLI copies the generated CSS (frozen, readable); the package is there for tooling, tests and the runtime switcher |
| Helpers (`cn`, `variants`, `Slot`, locale) | **Copied source**                               | 40-line files; a dependency would be heavier than the code                                                                                                                                                                                                                                    |

Rejected alternatives:

- _Pure npm component package_ — fast to adopt, but the three dashboards already
  fork their primitives per app and want to keep doing so; a package would turn
  every local tweak into a fork or a PR.
- _Pure shadcn registry format_ — we do speak the same idea (items with files,
  derived dependencies, `add`), but shadcn's tooling assumes Radix, `components.json`
  aliases and a fixed token set; the manifest here is smaller and adds `category`,
  `tier` and a build that enforces our house rules.

### Registry

Each item is `packages/registry/registry/items/<name>.json` (name, type, category,
files). `pnpm build:registry` reads every manifest, inlines the files, and
**derives** `dependencies` (npm) and `registryDependencies` (other items) by
scanning imports — a contributor never maintains dependency lists by hand. It
fails if an import resolves to nothing, two items claim a file, or a name is not
kebab-case. A test (`registry/registry.test.ts`) also enforces the house rules on
every source file (logical properties, no hex colours, no `any`, ≤500 lines, a
test beside every source).

Output (`registry-out/`): `index.json`, `items/<name>.json` (with sources) and
`css/` (generated tokens). The CLI bundles a copy, so `sas-ui add` works offline
and reproducibly for a given CLI version; `--registry <dir|url>` points anywhere
(a static host works).

### Import aliases

Sources import each other through four aliases: `@/components/ui/*`, `@/lib/*`,
`@/hooks/*`, `@/test/*`. The CLI rewrites them to the project's `sas-ui.json`
(`alias`, `directories`); with the defaults the copy is byte-identical to the
registry file, which is what makes `sas-ui diff` meaningful.

### CLI

`init` detects the Tailwind entry stylesheet, writes `sas-ui.json`, the token CSS,
the alias setup (tsconfig `paths` + Vite 8 `resolve.tsconfigPaths`, patched
conservatively and reported) and the foundation helpers. `add` resolves
dependencies (dependencies first), copies files, never overwrites a changed file
without `--overwrite`, and installs npm dependencies with the detected package
manager. `diff` compares project files to the registry after alias rewriting.
`theme set` swaps the palette. No runtime dependencies — `node:util.parseArgs`
and `fetch`.

### Docs app

The docs app aliases the same `@/…` paths straight to `packages/registry/src`,
so every example renders the file a project would receive. A global toolbar
switches preset, light/dark, language and direction. The tokens page renders
every swatch, the type ramp, radii, elevation and the live contrast matrix.

## Theming

See [`THEMING.md`](THEMING.md). In one paragraph: a preset is a TypeScript object
with a _light_ and a _dark_ map of ~78 core tokens; the generator derives the
shadcn-style aliases (`--card`, `--border`, `--ring` …) as `var()` references and
emits CSS scoped by `:root[data-preset="…"]`. `theme.css` maps every token to a
Tailwind utility through `@theme inline`, so utilities such as `bg-surface` or
`text-text-muted` read live CSS variables and switching presets needs no rebuild.

## Conventions that shape the code

- **No hidden magic.** One component = readable files. No global registries, no
  context a component needs that is not documented.
- **Strings are props.** Every component carries ar/en defaults via
  `useLabels(messages, overrides)`; the locale comes from a tiny
  `LocaleProvider` or `<html lang>`. No i18n library is imposed.
- **`cn()` knows our design system.** `tailwind-merge` is extended with the type
  ramp (`text-h1`…), role spacing (`p-card`) and role radii so merging never
  drops a class silently.
- **States are designed.** Data components take loading / error / empty / success
  as a discriminated union, not boolean soup.
- **Tests are shipped.** Each component has a Vitest + Testing Library + axe test
  (optionally copied with `add --tests`).

## Versioning and release

The CLI and registry share a version; the registry index carries it. Components
are copied, so a breaking change only reaches a project when it runs `add
--overwrite` — `diff` first shows exactly what would change. Publishing to npm is
a deliberate, manual step.
