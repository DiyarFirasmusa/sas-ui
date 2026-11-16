# Changelog

All notable changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/) once 1.0 is published.

## [Unreleased]

### Added (continued)

- Hijri calendar and month/year dropdowns; DataTable virtualisation, grid keyboard navigation, grouping, CSV export and
  saved views; `status-bar`, `filter-builder`, `arabic-normalize`.

- Docs site redesigned after ui.shadcn.com: top navigation (Docs, Components, Blocks, Charts, Themes), grouped sidebar,
  "On this page" column, ⌘K search, Preview/Code tabs per example, a Blocks gallery with responsive previews, a Charts
  gallery and a Themes gallery (light and dark side by side). Presets can now be scoped to a subtree with
  `data-preset-scope` / `data-mode`.

- Improvements upstreamed from the ERP pilot: `Button` (`asChild`, `navy`, `pill`, compound `link`), `Input`/`Textarea`
  `size` and `autoDirection`, `Switch` `size`/`mirror`, `select-parts` (composable Select), `Dialog` sizes, `Sheet` physical
  sides, `Popover` positioner props, `DropdownMenu` sub-content/shortcut/inset, new `tab-bar` and `steps`, `Skeleton`
  shimmer, `ScrollArea` `scrollbars`, `Table` `containerLabel`, `Toaster` physical positions, `Chart` `image`.
- CLI: `sas-ui upstream` sends an improved component from a project back to a library checkout.
- Docs: [Continuous improvement](docs/CONTINUOUS-IMPROVEMENT.md) workflow.

- **Design system alignment:** components now default to the look of the owner's dashboards instead of a generic shadcn
  look — control geometry as preset data (`h-control*`, `rounded-control`, `text-control*`; compact for inventory/tourism,
  comfortable for HR), the dashboards' sidebar, topbar and shell (with an `hr` variant), buttons, fields, tabs, tables,
  dialogs, badges and page blocks. See [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

### Fixed

- `Button loading` no longer lets a submit button submit its form a second time.

### Added

- `@sas-ui/tokens`: colour token contract, four data-driven presets (`neutral`,
  `wine-lapis`, `inventory`, `hr`), CSS generator, runtime preset/mode/direction
  switcher, WCAG AA contrast checks, CSS importer for existing palettes.
- `@sas-ui/registry`: copy-in component sources with tests and a registry builder
  that derives dependencies from imports and enforces the house rules.
- `@sas-ui/cli`: `init`, `add`, `diff`, `list`, `theme`.
- 87 registry items covering forms, overlays, navigation, data (DataTable, FilterBar, Tree), feedback,
  charts, rich text, app shell and theming UI.
- Blocks: a `block` registry item type (installed to `components/blocks`) and 16 blocks — sign-in, dashboard,
  shells, list/detail/approval/form/wizard/settings pages, error pages and chart cards.
- Docs/preview app: every component with live examples across presets, light/dark,
  Arabic/English and RTL/LTR.
