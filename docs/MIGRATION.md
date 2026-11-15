# Migrating the three dashboards (Phase 2)

> Nothing here has been applied. The three apps (`erp-tourism-react`,
> `erp-hr-frontend`, `erp-Inventory-frontend`) are untouched; this is the plan,
> to run only when explicitly started.

All three share the same stack (Base UI, Tailwind v4, i18next ar/en, sonner, the
same hand-built primitives), which is why the library's token names, file names
and APIs were kept recognisable: for most components the migration is *delete
the local file, `sas-ui add` the library one, fix imports*.

## Strategy

1. **Pilot on `erp-tourism-react`** (newest, least legacy, the palette is being
   redesigned there anyway). Fix whatever the pilot reveals in the library.
2. Then `erp-Inventory-frontend` (closest palette), then `erp-hr-frontend`
   (sidebar differs: deep plum sidebar in light mode, which is a `hr` preset value).
3. One PR per app, split in the order below so every step stays green
   (`typecheck`, `lint`, `test`, e2e). Never mix a visual redesign with a migration.

### Ground rules

- Keep each app's **feature code unchanged**; only `src/components/**`,
  `src/style/**` and the layout shells are touched.
- Use `sas-ui diff` after every step. Components are copies — an app may keep
  deliberate local edits, but they should be visible in the diff, not accidental.
- Run the app's existing tests; where a test queries a class name from the old
  `*.css` (e.g. `.btn-primary`), switch it to role/text queries.
- Do **not** switch an app's i18n to the library's: library components take label
  props and carry ar/en defaults; the app keeps passing its own translated strings
  where it needs wording that differs.

## Step 0 — Install and tokens

```sh
npx sas-ui init --preset <wine-lapis|inventory|hr> --all-presets --css src/style/styles.css
```

- `init` writes `src/style/sas-ui/theme.css` + `preset.css`, imports them into the
  entry stylesheet, adds `cn()`/`variants()` and the alias (all three apps already
  use `@/`).
- **Delete** the app's `src/style/tokens-colors.css`, `tokens-type.css` and the
  `@theme inline` block in `styles.css` once the app builds with the generated
  files: the token names are identical, so utilities (`bg-surface`, `text-text-muted`,
  `border-stroke`, `gap-field`, `text-h1`…) keep working.
- Keep `.cn-toast`, scrollbar and view-transition rules in `styles.css` for now
  (theme ripple is app-level; see "Not covered").
- Replace the app's `tokens-contrast.test.ts` with the tokens package test
  (`checkPreset`) or keep both until confident.
- `cn()` — replace `src/lib/utils.ts` and the vendored `variants.ts`/`slot.ts`
  (`src/lib/vendor/`) with the library versions. `cn` now runs `tailwind-merge`
  (extended for the type ramp and role spacing): audit places that relied on two
  conflicting classes both being emitted (rare; `rg "cn\\(" | rg "text-"`).

## Step 1 — Primitives (`src/components/ui`)

| App file | Library item | Notes |
| -------- | ------------ | ----- |
| `button.tsx` (+ `style/button.css`) | `button` | `variant`: `default`→`default`, `navy`→(add a project variant), `outline`, `outlinePrimary`→`outline-primary`, `secondary`→`secondary`, `ghost`, `destructive`→`destructive-soft`, `destructiveSolid`→`destructive`, `link`. Sizes `xs sm default lg icon icon-xs icon-sm icon-lg`; `pill` → `className="rounded-pill"`. New: `loading` prop replaces hand-rolled spinners. `asChild` → render a link with `buttonVariants()` |
| `input.tsx`, `textarea.tsx`, `label.tsx` (+ `input.css`) | `input`, `textarea`, `label` | Direction logic (`dir=auto` once typed, `kind="latin"` for codes) now built in; remove per-field `dir` hacks |
| `checkbox.tsx`, `switch.tsx` | `checkbox`, `switch` | same props (Base UI) |
| `select.tsx` (+ `select.css`) | `select` | options-array API; the app's `select-control` wrapper (`SelectOption`) maps 1:1 to `options={[{value,label}]}` |
| `dialog.tsx` | `dialog` | adds `DialogBody`, localised close |
| `sheet.tsx` | `sheet` | `side="start"|"end"` are logical |
| `dropdown-menu.tsx` | `dropdown-menu` | adds `destructive` item prop |
| `tooltip.tsx` | `tooltip` | wrap the app in the library `TooltipProvider` |
| `tabs.tsx` (+ `tabs.css`) | `tabs` | `underline` / `pill` variants |
| `steps.tsx` (+ `steps.css`) | `stepper` | states complete/current/upcoming/error |
| `skeleton.tsx`, `avatar.tsx`, `scroll-area.tsx` | `skeleton`, `avatar`, `scroll-area` | avatar adds Arabic-safe initials |
| `sonner.tsx` | `toast` | same `sonner` underneath; the API clients keep calling `toast.*` — swap `Toaster` and (optionally) `notify` |
| `chart.tsx` | `chart` (extra) | `ChartContainer` + `config` model is compatible |
| `table.tsx` (+ `style/*` table bits) | `table` | primitives |
| `form.tsx` | `form` | RHF `FormField`/`Field` wrappers; server-error mapping helper replaces the apps' ad-hoc mapping |
| `lib/icons.tsx` (hugeicons) | `icons` | the library ships its own tiny SVG set; the apps may **keep hugeicons** and pass their icons as children — library components only import the internal icons for chevrons/check/close |

## Step 2 — Fields (`src/components/fields`)

The apps' `*-field.tsx` files are **react-hook-form bound** (`<TextField control name label … />`).
They stay as thin app-level adapters over library controls:

| App file | Replace the control with | Keep the adapter? |
| -------- | ------------------------ | ----------------- |
| `text-field.tsx`, `textarea-field.tsx` | `input`/`textarea` inside `field` | `form-fields` item (`TextField`, `TextareaField`, … same prop names: `control`, `name`, `label`, `required`) |
| `select-field.tsx`, `select-control.tsx` | `select` | yes, via `form-fields` |
| `combobox.tsx`, `combobox-field.tsx` (+ paging) | `combobox` (async/paged: `onSearchChange`, `onLoadMore`) | yes |
| `org-unit-combobox-field.tsx`, `person-select-field.tsx` | `combobox` / `tree-picker` | app-specific, rebuild on the library control |
| `number-input.tsx`, `number-field.tsx` | `number-input` | yes |
| `date-input.tsx` | `date-picker` | yes — value is an ISO `yyyy-mm-dd` string; pass `numerals="latn"` |
| `time-input.tsx` | `time-picker` | yes — `HH:mm` |
| `switch-field.tsx` | `switch` | yes |
| `file-picker.tsx`, `photo-field.tsx` | `file-upload` | yes |
| `field.tsx`, `read-only-field.tsx`, `read-only-switch-row.tsx` | `detail-field` (read-only label/value) | replace |
| `use-live-validation.ts` | RHF `mode: 'onTouched'` + the `form` helpers | evaluate per form |

## Step 3 — Tables and filters

| App | Library |
| --- | ------- |
| `table/data-table*.tsx` (`DataTable`, `-row`, `-pagination`, `-row-actions`, `-skeleton`, `-empty`, `-error`) | `data-table` (+ `table`, `pagination`, `skeleton`, `empty-state`, `error-state`). The app's `TableSort`/`selection` props map to controlled `sorting` / `rowSelection`; loading/error/empty become one `state` union |
| `table/data-badge.tsx` | `data-badge` (`statusMap`) |
| `table/list-filters-bar`, `list-filter-select/toggle`, `list-search-field` (HR, Inventory) | `filter-bar` with `FilterDefinition[]` |
| `filters/metadata-*` (tourism) | `filter-bar` — the metadata model (`group`, types text/select/multi-select/boolean/range/date) is the same idea; keep the app-side mapping from backend metadata → `FilterDefinition` in `use-metadata-filters.tsx` |
| `shared/filter-chip.tsx`, `active-filter-chips.tsx` | built into `filter-bar` (chips + clear all) |
| URL ↔ filters | `lib/filter-state` serialise/parse helpers; the routers' typed search params stay the owner of state |

## Step 4 — Dialogs, shared, layout

| App | Library |
| --- | ------- |
| `dialog/confirm-dialog.tsx` | `confirm-dialog` (single-flight on async `onConfirm`) |
| `dialog/form-dialog.tsx`, `dialog-layout.tsx`, `dialog-form-grid.tsx` | `form-dialog` (+ `dialog` parts) |
| `dialog/unsaved-changes-dialog.tsx` | `form-dialog` `confirmDiscard` |
| `shared/result-dialog.tsx` | `confirm-dialog` / `dialog` (result variant is app-level) |
| `shared/page-header.tsx`, `breadcrumb.tsx` | `page-header`, `breadcrumb` |
| `shared/stat-card.tsx`, `stat-grid.tsx` | `stat-card` |
| `shared/section-title.tsx` | `section-title` |
| `shared/attachment-card.tsx` | `attachment-card` |
| `shared/user-avatar.tsx` | `avatar` |
| `wrapper/loading-wrapper.tsx` | `state-wrapper` (`status: loading | error | empty | success`; the app passes its `resolveApiErrorMessage`) |
| `editor/rich-text-editor.tsx` (tourism) | `rich-text-editor` (extra) |
| `organization-picker/*` (tourism) | `tree-picker` + `tree`; `organization-tree.ts` helpers map to `lib/tree-utils` |
| `layout/dashboard/*` (sidebar, topbar) | `app-shell`, `sidebar`, `sidebar-nav`, `topbar` — the app keeps its sidebar *config* (items, permissions) and passes it as `NavItem[]`; `renderLink` plugs in TanStack Router's `Link` |
| `layout/auth` | stays app-level (uses `--auth-panel-from/to`, `--brand-tile`, which presets provide) |
| theme + language switch, view-transition ripple | `theme-provider` + `theme-switcher`; the ripple stays an app enhancement |

## Step 5 — Cleanup and proof

- Delete the replaced files and now-empty `src/style/*.css` component sheets.
- `sas-ui diff` — expect "matches the registry" except intentional edits.
- Gates: `typecheck`, `lint`, `test`, `i18n:validate`, Playwright + axe in **both** languages,
  visual pass in light/dark for the app's preset.
- Update the app's `CLAUDE.md` component list and `.claude/rules/styles.md` to
  point at the library and `sas-ui add`.

## Not covered by the library (stay in the apps)

Router/guards/permissions, API clients and error mapping, query hooks, feature
column factories, the theme *ripple* animation, auth/landing layouts, domain
widgets (barcode, audit log, item thumbnails, approval notes, document list view),
Sentry. Feature code calls the library; the library never knows about them.

## Risks and how they are handled

| Risk | Mitigation |
| ---- | ---------- |
| Visual drift (button heights, radii) | Library defaults were taken from the apps (38px control, radius 0.75rem, same spacing roles). Compare screenshots per page before deleting the old files |
| `tailwind-merge` changes class output | Only affects conflicting classes; `cn` tests cover the SAS type ramp and spacing roles |
| Palette still moving (wine-lapis) | Re-import it: `node packages/tokens/scripts/import-preset.ts …` — the contrast test names any pair that regressed |
| Apps pin different dependency versions | `sas-ui add` lists the versions it installs; align `@base-ui/react`, `tailwind-merge`, `sonner` before migrating |
| Local tweaks overwritten | `add` never overwrites a changed file without `--overwrite`; use `diff` first |
