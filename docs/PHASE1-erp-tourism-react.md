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
