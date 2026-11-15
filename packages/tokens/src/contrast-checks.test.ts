import { describe, expect, it } from 'vitest';
import { PRESETS } from './all-presets.ts';
import { checkPreset, formatViolation } from './contrast-checks.ts';

describe('preset contrast (WCAG AA)', () => {
  it.each(PRESETS.map((preset) => [preset.name, preset] as const))(
    '%s meets AA in light and dark',
    (_name, preset) => {
      expect(checkPreset(preset).map(formatViolation)).toEqual([]);
    },
  );
});
