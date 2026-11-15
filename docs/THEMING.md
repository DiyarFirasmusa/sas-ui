# Theming

## The token contract

Every preset defines the same ~78 colour tokens for **light** and **dark**, in
groups (`packages/tokens/src/token-names.ts`):

| Group | Tokens |
| ----- | ------ |
| surfaces | `background surface surface-dim surface-elevated popover secondary hover-row surface-solid-secondary kbd switch-off scrim` |
| text | `text-primary text-secondary text-muted text-inactive` |
| brand | `primary primary-foreground primary-hover primary-container primary-text primary-highlight primary-light primary-tint brand-light brand-dark` |
| borders | `stroke stroke-subtle stroke-strong` |
| status | `success warning danger info` + `*-foreground` |
| tags | 8 hues (`green red yellow orange cyan purple blue neutral`), each a text colour and a translucent container |
| neutral | `neutral-700 … neutral-50` |
| sidebar | `sidebar sidebar-foreground sidebar-accent(-foreground) sidebar-selected(-foreground) sidebar-border sidebar-ring` |
| accents | `gold coral auth-panel-from/to brand-tile(-foreground)` |
| charts | `chart-1 … chart-5` |

The generator also emits shadcn-style aliases as `var()` references
(`--card → --surface`, `--border → --stroke`, `--ring → --primary-highlight`,
`--accent → --primary-light`, `--muted → --secondary` …), so shadcn-flavoured
utilities (`bg-card`, `border-border`) work too.

Non-colour tokens live in `packages/tokens/src/css/foundation.css` and are
shared by all presets: **spacing by role** (`field 8 · inline 12 · row 16 ·
panel 20 · card 24 · page 32`, used as `gap-field`, `p-card`), **radii**
(`sm…2xl`, `control`, `modal`, `pill`, derived from the preset's `--radius`),
**elevation** (`shadow-small/mid/large/xlarge/primary`), the **type ramp**
(`text-h1…h5`, `text-b1…b3`, `text-label`, `text-kpi`, one utility sets size,
line-height, weight and family) and the base layer (focus ring, reduced motion).

## Presets

| Preset | Character | Source |
| ------ | --------- | ------ |
| `neutral` | zinc greys, ink primary; default for new projects | new |
| `wine-lapis` | burgundy wine + lapis navy + gold | `erp-tourism-react` (living: re-import to follow it) |
| `inventory` | warm burgundy on charcoal | `erp-Inventory-frontend` |
| `hr` | plum + gold, deep plum sidebar | `erp-hr-frontend` (text-muted and tag-yellow nudged to pass AA — noted in the file header) |

### Using them

```sh
npx sas-ui init --preset wine-lapis            # one preset as :root / .dark
npx sas-ui init --preset wine-lapis --all-presets   # every preset, switch at runtime
npx sas-ui theme set hr                        # swap later
```

Runtime switching (all-presets mode):

```ts
import { applyPreset, applyMode, applyDirection } from '@sas-ui/tokens/apply-preset';
applyPreset('inventory');   // <html data-preset="inventory">
applyMode('dark');          // <html class="dark">
applyDirection('rtl', 'ar'); // <html dir="rtl" lang="ar">
```

Embed `noFlashScript(defaultPreset)` in `<head>` to avoid a flash of the wrong theme.
The registry also ships a `theme-provider` / `theme-switcher` copy of this logic.

### Contrast

`checkPreset(preset)` (tested for every shipped preset) verifies, in both themes:
all text tokens on canvas and surfaces (4.5:1), text on tinted and solid fills,
every tag hue on its own container composited over the surface, status badge text
straight on the canvas, sidebar pairs, and the focus ring (3:1, WCAG 1.4.11).
`--text-inactive` is exempt: it is for disabled labels only (WCAG 1.4.3).

### Creating a preset

1. Copy `presets/neutral.ts`, rename, change values.
2. Register it in `all-presets.ts`.
3. `pnpm --filter @sas-ui/tokens test` — fix any contrast failure it names
   (`hr/light: --text-muted on --background is 4.27:1 …`).
4. `pnpm build:tokens && pnpm build:registry`.

### Importing an existing palette

An app's `tokens-colors.css` (`:root` for light, `.dark` for dark) can be turned
into a preset; missing tokens fall back to related ones, `var(--x)` aliases are
resolved, and the dark block inherits theme-independent values from light:

```sh
cd packages/tokens
node scripts/import-preset.ts <path>/tokens-colors.css wine-lapis "Wine & Lapis" "نبيذي ولازوردي" "Description"
pnpm test   # contrast gate
```

Re-run it whenever the source palette changes.
