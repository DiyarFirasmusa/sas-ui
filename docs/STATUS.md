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
- 1,565 unit/component tests: tokens 21, CLI 19, registry 1,436 (Testing Library + user-event + axe,
  Arabic/RTL cases), docs 89 (every example renders in English and Arabic).
- `pnpm build` (tokens, registry JSON, CLI, docs) and `pnpm e2e:cli`: init → add (incl. data-table, forms,
  shell, command palette, tests) → diff → theme set → typecheck → production build in a fresh Vite app.
- Docs app opened in the browser in light/dark, RTL/LTR, several presets: button, data table,
  calendar, app shell, tokens page.

## Not verified / known gaps

- **Browser-level checks.** jsdom has no layout: sticky columns, popup positioning, slide animations,
  resizable drag, tab underline, two-month calendar, toast styling and PDF rendering were only checked by
  class/DOM assertions. axe colour-contrast is not run in jsdom (preset contrast _is_ tested on the tokens).
  A Playwright + axe pass over the docs app is the next step.
- **Keyboard navigation inside Base UI popups** (select, menus) is covered only for open/close/Escape in jsdom.
- **Icons:** a small in-house SVG set; apps keeping hugeicons pass their own icons as children.
- Calendar: no month/year dropdowns, outside-month days are empty cells. Time picker: label click does not
  focus it. Rich text: heading tool toggles H2 only; links use an inline bar. PDF viewer: load errors surface
  only through a timeout or the `error` prop (iframes do not report them).
- `DropdownMenuSub` has no content part yet.
- Not published: no npm release, no hosted docs, no registry URL. `sas-ui add` uses the registry bundled
  with the CLI.
- Phase 2 (applying the library to the three dashboards) has not started; see `MIGRATION.md`.
