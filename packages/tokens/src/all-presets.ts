import { hr } from './presets/hr.ts';
import { inventory } from './presets/inventory.ts';
import { neutral } from './presets/neutral.ts';
import { wineLapis } from './presets/wine-lapis.ts';
import type { Preset } from './token-names.ts';

/** The shipped presets. `neutral` is the default for new projects. */
export const PRESETS: readonly Preset[] = [neutral, wineLapis, inventory, hr];
export const DEFAULT_PRESET = 'neutral';

export function findPreset(name: string): Preset | undefined {
  return PRESETS.find((preset) => preset.name === name);
}
