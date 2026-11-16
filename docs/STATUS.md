# Status

Pre-1.0. Everything below is from the first build session.

## What exists

| Area                                                                                                      | State                                                                 |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Token system + 4 presets (`neutral`, `wine-lapis`, `inventory`, `hr`)                                     | done; AA contrast gate in both themes; importer for existing palettes |
| Registry: 87 items (≈ 60 components, helpers, hooks, test utilities)                                      | done; manifests, derived dependencies, house-rule tests               |
| CLI `init · add · diff · list · theme`                                                                    | done; end-to-end checked against a real scratch Vite app              |
| Docs app: examples for every component, preset/mode/language/direction switches, token and contrast pages | done                                                                  |
| Docs: architecture, theming, component guide, migration plan, contributing                                | done                                                                  |

Components: Button, Input, Textarea, Label, Field, Form (+ zod, server errors), Form fields,
Select, Combobox (async/paged), MultiSelect, Checkbox, RadioGroup, Switch, Slider, NumberInput,
Calendar, DatePicker, DateRangePicker, TimePicker, FileUpload, Dialog, ConfirmDialog, FormDialog,
Sheet, Popover, Tooltip, DropdownMenu, ContextMenu, Command, Tabs, Accordion, Stepper, Breadcrumb,
Pagination, Table, DataTable, FilterBar, Tree, TreePicker, Badge, DataBadge, Alert, Toast, Skeleton,
Spinner, Progress, Avatar, Card, StatCard, Timeline, EmptyState, ErrorState, StateWrapper,
PageHeader, SectionTitle, DetailField, AttachmentCard, Kbd, Separator, ScrollArea, Resizable,
Chart, RichTextEditor, PdfViewer, AppShell (Sidebar, Topbar), ThemeProvider, ThemeSwitcher.

## Verified

- `pnpm typecheck`, `pnpm lint`, `pnpm fmt:check`: clean.
- 2,501 unit/component tests: tokens 21, CLI 19, registry 2,343 (Testing Library + user-event + axe,
  Arabic/RTL cases), docs 118 (every example and block renders in English and Arabic).
- `pnpm build` (tokens, registry JSON, CLI, docs) and `pnpm e2e:cli`: init → add (incl. data-table, forms,
  shell, command palette, tests) → blocks (dashboard, list, detail, shell, wizard, login, errors) → diff → theme set → typecheck →
  production build in a fresh Vite app.
- Docs app opened in the browser in light/dark, RTL/LTR, several presets: button, data table,
  calendar (Hijri), status bar, 10,000-row virtualised table, app shell, tokens page, dashboard-01 and list-page-01 blocks (Arabic RTL) and shell-01 at
  mobile width. The other blocks were checked in jsdom only.

## Added after the research report

- **Hijri calendar:** `Calendar`, `DatePicker`, `DateRangePicker` take `calendarSystem` (`gregory`, `islamic-umalqura`,
  `islamic-civil`), `secondaryCalendar` (Gregorian small under Hijri) and `captionLayout="dropdowns"` (month/year
  selects). Values stay Gregorian ISO; only the display changes. No new dependency (Intl).
- **DataTable v2 (opt-in):** virtualised body (10,000 rows, `aria-rowcount`), APG grid keyboard navigation with
  RTL-mapped arrows, row grouping, Arabic-Excel-safe CSV export, saved views.
- **`status-bar`** (Odoo-style stage pipeline, RTL arrows), **`filter-builder`** (nested AND/OR rules, URL round trip),
  **`arabic-normalize`** (diacritics, alef/ya forms, Arabic-Indic digits, Persian letters).

## Next

1. Adopt `arabic-normalize` in Combobox, DataTable and FilterBar search (command-filter and tree-utils still use their own).
2. Input family: PhoneInput (+964), CurrencyInput (IQD), mask, tags.
3. Blocks: import wizard, printable RTL documents, kanban, scheduler.
4. Publish the CLI and host a registry URL.

## Not verified / known gaps

- **Browser-level checks.** jsdom has no layout: sticky columns, popup positioning, slide animations,
  resizable drag, tab underline, two-month calendar, toast styling and PDF rendering were only checked by
  class/DOM assertions. axe colour-contrast is not run in jsdom (preset contrast _is_ tested on the tokens).
  A Playwright + axe pass over the docs app is the next step.
- **Keyboard navigation inside Base UI popups** (select, menus) is covered only for open/close/Escape in jsdom.
- **Icons:** a small in-house SVG set; apps keeping hugeicons pass their own icons as children.
- Calendar: outside-month days are empty cells; Umm al-Qura is table-based and can differ from moon sighting. Time picker: label click does not
  focus it. Rich text: heading tool toggles H2 only; links use an inline bar. PDF viewer: load errors surface
  only through a timeout or the `error` prop (iframes do not report them).
- `DropdownMenuSub` has no content part yet.
- Not published: no npm release, no hosted docs, no registry URL. `sas-ui add` uses the registry bundled
  with the CLI.
- Phase 2 (applying the library to the three dashboards) has not started; see `MIGRATION.md`.
