import { contrastRatio, resolveOver } from './color.ts';
import { TAG_HUES } from './token-names.ts';
import type { CoreTokenName, Preset, ThemeTokens } from './token-names.ts';

export interface ContrastRule {
  foreground: CoreTokenName;
  background: CoreTokenName;
  minimum: number;
  /** Why this pair exists — shown in failure messages. */
  reason: string;
}

export interface ContrastViolation {
  preset: string;
  theme: 'light' | 'dark';
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
  reason: string;
}

const AA_TEXT = 4.5;
const AA_UI = 3;

/** Text tokens that sit directly on the canvas and card surfaces. */
const CANVAS_BACKGROUNDS: readonly CoreTokenName[] = [
  'background',
  'surface',
  'surface-dim',
  'hover-row',
];
const CANVAS_TEXT: readonly CoreTokenName[] = [
  'text-primary',
  'text-secondary',
  'text-muted',
  'primary-text',
  'success',
  'warning',
  'danger',
  'info',
];

const PAIRS: readonly (readonly [CoreTokenName, CoreTokenName, string])[] = [
  ['primary-text', 'primary-light', 'text on the active chip / nav tint'],
  ['text-primary', 'primary-light', 'body text on the active tint'],
  ['primary-foreground', 'primary', 'primary button label'],
  ['primary-foreground', 'primary-hover', 'primary button label (hover)'],
  ['success-foreground', 'success', 'success fill label'],
  ['warning-foreground', 'warning', 'warning fill label'],
  ['danger-foreground', 'danger', 'danger fill label'],
  ['info-foreground', 'info', 'info fill label'],
  ['sidebar-foreground', 'sidebar', 'sidebar item'],
  ['sidebar-accent-foreground', 'sidebar-accent', 'sidebar hover / active item'],
  ['sidebar-selected-foreground', 'sidebar-selected', 'sidebar selected pill'],
  ['text-primary', 'secondary', 'text on the muted fill'],
  ['text-secondary', 'secondary', 'secondary text on the muted fill'],
  ['text-primary', 'surface-solid-secondary', 'text on solid secondary fills'],
  ['brand-tile-foreground', 'brand-tile', 'brand tile glyph'],
];

/** Every text/background pair a preset must keep at WCAG AA. */
export function contrastRules(): readonly ContrastRule[] {
  const rules: ContrastRule[] = [];
  for (const background of CANVAS_BACKGROUNDS) {
    for (const foreground of CANVAS_TEXT) {
      rules.push({
        foreground,
        background,
        minimum: AA_TEXT,
        reason: 'text on canvas and surfaces',
      });
    }
  }
  for (const [foreground, background, reason] of PAIRS) {
    rules.push({ foreground, background, minimum: AA_TEXT, reason });
  }
  rules.push(
    {
      foreground: 'primary-highlight',
      background: 'surface',
      minimum: AA_UI,
      reason: 'focus ring (WCAG 1.4.11 non-text contrast)',
    },
    {
      foreground: 'primary-highlight',
      background: 'background',
      minimum: AA_UI,
      reason: 'focus ring on the page canvas',
    },
  );
  return rules;
}

function checkTheme(
  presetName: string,
  themeName: 'light' | 'dark',
  tokens: ThemeTokens,
): ContrastViolation[] {
  const violations: ContrastViolation[] = [];
  const record = (
    foreground: string,
    background: string,
    ratio: number,
    minimum: number,
    reason: string,
  ) => {
    if (ratio < minimum) {
      violations.push({
        preset: presetName,
        theme: themeName,
        foreground,
        background,
        ratio: Math.round(ratio * 100) / 100,
        minimum,
        reason,
      });
    }
  };

  for (const rule of contrastRules()) {
    record(
      rule.foreground,
      rule.background,
      contrastRatio(tokens[rule.foreground], tokens[rule.background]),
      rule.minimum,
      rule.reason,
    );
  }

  // Tags render their hue on the hue's own translucent container, which sits
  // on a card surface — so the container is composited over --surface first.
  for (const hue of TAG_HUES) {
    const text = tokens[`tag-${hue}`];
    const container = resolveOver(tokens[`tag-${hue}-container`], tokens.surface);
    record(
      `tag-${hue}`,
      `tag-${hue}-container`,
      contrastRatio(text, container),
      AA_TEXT,
      'tag text on its own container',
    );
    if (hue !== 'neutral') {
      for (const background of CANVAS_BACKGROUNDS) {
        record(
          `tag-${hue}`,
          background,
          contrastRatio(text, tokens[background]),
          AA_TEXT,
          'untinted status badge text',
        );
      }
    }
  }
  return violations;
}

/** Returns every contrast failure of a preset, in both themes. */
export function checkPreset(preset: Preset): ContrastViolation[] {
  return [
    ...checkTheme(preset.name, 'light', preset.light),
    ...checkTheme(preset.name, 'dark', preset.dark),
  ];
}

export function formatViolation(violation: ContrastViolation): string {
  return `${violation.preset}/${violation.theme}: --${violation.foreground} on --${violation.background} is ${violation.ratio}:1 (needs ${violation.minimum}:1) — ${violation.reason}`;
}
