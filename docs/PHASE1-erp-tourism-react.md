# Phase 1 — erp-tourism-react (pilot)

First step of [MIGRATION.md](MIGRATION.md), applied to `erp-tourism-react` on 2026-11-16. The app is not a git
repository, so a copy of the untouched project (without `node_modules`) was taken first at
`diyar/erp-tourism-react.pre-sas-ui-backup`. Nothing was committed or pushed in the app.

## What changed in the app

| File                                | Change                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/lib/utils.ts`                  | `cn()` now runs `tailwind-merge`, extended for the type ramp (`text-h1`, `text-display`…), role spacing and role radii |
| `src/lib/vendor/variants.ts`        | library `variants()` (adds compound variants and boolean variants; same call shape)                                    |
| `src/lib/vendor/slot.ts`            | library `Slot` (same API)                                                                                              |
| `package.json`, `package-lock.json` | `tailwind-merge ^3.7.0`                                                                                                |
| `sas-ui.json`                       | new: lets `sas-ui diff` / `add` work in the app (aliases and folders match the app)                                    |

No component, style or token file was edited.

## Verified in the app

`typecheck`, `lint:check`, `fmt:check`, `npm run build`, and the full unit suite (262 files, 1,872 tests) pass,
identical to the baseline taken before the change (1,872 tests).

## Palette

`wine-lapis` was re-imported from the app's current `tokens-colors.css` (the palette changed after the first import: the
selected sidebar item is now blue, the auth panel navy). The preset passes the AA contrast gate in both themes. The app's
token names are identical to the library's, so `sas-ui init --preset wine-lapis` can replace
`tokens-colors.css` + the `@theme` block in a later step; it was deliberately not done in this step.

## Drift report (`sas-ui diff`, lines added/removed in the library version vs the app file)

button +63/−47 · input +55/−5 · label +16/−18 · textarea +35/−8 · checkbox +20/−9 · switch +50/−15 ·
select +90/−182 · dialog +45/−106 · sheet +87/−79 · dropdown-menu +73/−185 · tabs +97/−176 · tooltip +73/−40 ·
skeleton +91/−2 · avatar +131/−84 · scroll-area +51/−17 · table +114/−42 · chart +318/−302 · form +126/−154.

Name differences: app `steps.tsx` ↔ library `stepper`, app `sonner.tsx` ↔ `toast`, app `lib/vendor/variants.ts` ↔
`lib/variants.ts`.

## Why no primitive was swapped yet

A trial swap of `skeleton` replaced the app's shimmer animation with the library's pulse, and its CSS lives in the app's
own `button.css` / `input.css` / … sheets (`.btn`, `.control`). A primitive swap is a visual decision per component, so
each one needs a side-by-side check against the Figma and the app's e2e/axe run. The trial was reverted.

## Suggested order for the next steps

1. `label`, `separator`, `kbd`, `scroll-area` (no app CSS sheet involved).
2. `skeleton` — add the shimmer to the library first (`animate-skeleton-shimmer` utility) or keep the app's.
3. `button`, `input`, `textarea`, `select`, `checkbox`, `switch` — together with deleting `button.css`, `input.css`,
   `select.css`, then a visual pass on every screen in Arabic and English.
4. `dialog`, `sheet`, `dropdown-menu`, `tabs`, `tooltip`, `avatar`, `table`, `chart`.
5. Tokens: `sas-ui init --preset wine-lapis`, delete `tokens-colors.css` and the `@theme` colour block.
6. Fields, `data-table`, `filter-bar`, dialogs, layout.

## Step 2 — first primitives (2026-11-16)

Added with `sas-ui add label scroll-area --overwrite`, then tailored to the app's existing look (the app's design wins):

| App file                        | Result                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/ui/label.tsx`       | library `Label` shape (`required` prop) with the app's classes (`gap-2`, inherited colour, `group-data-[disabled]`) and the app's `RequiredMark` export kept — every existing import still works |
| `components/ui/scroll-area.tsx` | library `ScrollArea`: direction-aware (follows `<html lang>` through `lib/locale.tsx`), focusable viewport, `orientation` prop; scrollbars kept always visible like before                       |
| `lib/locale.tsx`                | new (the library's tiny locale context; falls back to `<html lang>`, so no provider is needed in the app)                                                                                        |

`separator` and `kbd` do not exist in the app and nothing uses them, so they were not added. Gates after the change:
typecheck, lint, fmt, build and the 1,872 unit tests pass, same as the baseline.

Lesson for the next batches: a clean `add --overwrite` changes visuals (label colour, scrollbar visibility, shimmer), so each
swap is "add, then restore the app's look in the copy, then `sas-ui diff` documents what is left". Next candidates:
`tooltip`, `avatar`, `skeleton` (needs the shimmer), then the form controls with their CSS sheets.

## Step 3 — all primitives on the library (2026-11-16)

Every file in the app's `src/components/ui/` is now a tailored copy of the library component, and **no file outside
`src/components/ui` and `src/lib/locale.tsx` imports `@base-ui/react`** (enforced by a new `no-restricted-imports` rule in
`oxlint.config.ts`). Base UI remains the engine inside the library components.

| App primitive                                       | Source                                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| button, input, textarea, checkbox, switch, label    | library, tailored to the app's look (app variant names kept: `navy`, `outlinePrimary`, `destructive` = soft, `destructiveSolid`; `asChild` kept; opt-in `loading` added) |
| select                                              | library visuals/behaviour; the app's composable `Select*` API kept (call sites need custom value renderers)                                                              |
| dialog, sheet, tooltip, dropdown-menu               | library, same look and exports; sheet gains logical `start`/`end` sides                                                                                                  |
| popover (new)                                       | library Popover with the extra Positioner props the app needs; replaces 5 direct Base UI imports (combobox, date, time, tree picker, notifications)                      |
| tabs, steps                                         | app's own items-based API kept (no Base UI), restyled as utilities (`tabs.css`, `steps.css` deleted)                                                                     |
| avatar, skeleton, table, chart, sonner, scroll-area | library, app look kept (skeleton keeps its look; chart gets `lib/chart.ts`)                                                                                              |
| `LocaleProvider`                                    | mounted at the app root through `I18nLocaleProvider`, so Base UI popups, sliders and arrow keys follow ar/en direction                                                   |

CSS removed: `button.css`, `tabs.css`, `steps.css`, the `.cn-toast` block, and most of `input.css` and `datepicker.css`.
Still there until the remaining users migrate: `.control` (`input.css`), `select.css`, `.number-control` (`datepicker.css`).

Checks in the app: `typecheck`, `lint:check` (0 errors), `fmt:check`, **1,929 unit tests** (was 1,872), `npm run build`,
and the Playwright suite: **83 functional/mobile tests and the axe WCAG 2.1 AA pages in ar/en × light/dark all pass**.
Not checked: a pixel-for-pixel comparison against the Figma (no visual regression tooling here).

Library fix found during this step: `Textarea` overwrote the caller's `ref` (react-hook-form could not focus an invalid
field); it now forwards both refs.
