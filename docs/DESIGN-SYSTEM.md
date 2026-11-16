# The design system SAS UI implements

SAS UI takes its **structure** from shadcn/ui (copy-in registry, blocks, docs layout) but its **look** — the shapes,
sizes, colours and layouts — from the owner's own dashboards. Where the two disagree, the dashboards win.

## Sources of truth (read these, do not guess)

| System          | Apps                                                                           | Sheets and components                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Compact**     | `erp-Inventory-frontend`, `erp-tourism-react` (their CSS sheets are identical) | `src/style/{button,input,select,badge,tabs,steps,pagination,actions,topbar,attachments,datepicker}.css`, `tokens-type.css`, `src/layout/dashboard/**`                                      |
| **Comfortable** | `erp-hr-frontend`                                                              | the same file names under its `src/style` (larger geometry, HR palette), `src/layout/dashboard/sidebar/components/{sidebar,sidebar-nav,sidebar-tenant,sidebar-user,sidebar-info-card}.tsx` |

All paths are under `/Users/diyarfiras/Desktop/project/SAS/`. The tourism app's tailored copies in
`erp-tourism-react/src/components/ui/` already express the compact system as Tailwind utilities.

## Geometry (data, per preset)

| Token                 | Compact (inventory, wine-lapis, neutral) | Comfortable (hr)             | Utility                           |
| --------------------- | ---------------------------------------- | ---------------------------- | --------------------------------- |
| button height         | 38px (lg 44 · sm 32 · xs 28)             | 44px (lg 52 · sm 40 · xs 32) | `h-control`, `h-control-lg/sm/xs` |
| input / select height | 42px                                     | 44px                         | `h-control-input`                 |
| control radius        | 10px                                     | 12px                         | `rounded-control`                 |
| button padding        | 16px                                     | 20px                         | `px-control-x`                    |
| button font           | 600 13/19.5                              | 500 16/1.2                   | `text-control`                    |
| field font            | 400 13/19.5                              | 400 14/1.5                   | `text-control-input`              |

Components never hardcode these numbers: they use the utilities above, so a preset (or a project) changes the geometry in
one place (`Preset.geometry`, see `packages/tokens/src/token-names.ts`).

## Rules

- Same names as the apps: tokens (`--surface`, `--stroke`, `--primary-highlight`…), spacing roles (`gap-field`, `p-card`),
  type ramp (`text-h1…`, `text-b1…`), radii (`rounded-control`, `rounded-modal`, `rounded-pill`, `rounded-nav`).
- Interaction states follow the apps: hover = a tinted surface, focus = a 2px outline (buttons) or a 3px glow (fields),
  invalid = danger border, disabled = `disabled-container` + inactive text.
- Layout components follow the apps' dashboard shell: the sidebar (brand header, grouped accordion nav, rail with
  tooltips, footer user card), the top bar (title, notifications, language, theme, user), cards at `--radius`, tables with
  the 11px header style.
- shadcn is a reference for _API shape and docs structure only_. If a library component looks like a stock shadcn
  component, it is a bug against this document.
