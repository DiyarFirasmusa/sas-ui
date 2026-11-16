# Changelog

All notable changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/) once 1.0 is published.

## [Unreleased]

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
