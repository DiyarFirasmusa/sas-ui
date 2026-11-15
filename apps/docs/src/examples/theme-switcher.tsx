import { ThemeProvider } from '@/components/ui/theme-provider';
import { ThemeSwitcher, type ThemePresetItem } from '@/components/ui/theme-switcher';
import type { Example } from '../example-types';

const PRESETS: ThemePresetItem[] = [
  { name: 'neutral', label: 'Neutral', swatch: '#18181b' },
  { name: 'hr', label: 'HR', swatch: '#5b2a6e' },
  { name: 'inventory', label: 'Inventory', swatch: '#6e2c3f' },
  { name: 'wine-lapis', label: 'Wine lapis', swatch: '#642b56' },
];

const NAMES = PRESETS.map((preset) => preset.name);

export const examples: Example[] = [
  {
    title: 'Menu',
    description:
      'Compact icon button for a topbar. Switching changes the docs page theme, mode and language.',
    render: () => (
      <ThemeProvider presets={NAMES} defaultPreset="neutral">
        <ThemeSwitcher presets={PRESETS} />
      </ThemeProvider>
    ),
  },
  {
    title: 'Inline',
    description: 'Segmented controls for a settings page.',
    wide: true,
    render: () => (
      <ThemeProvider presets={NAMES} defaultPreset="neutral">
        <ThemeSwitcher variant="inline" presets={PRESETS} />
      </ThemeProvider>
    ),
  },
  {
    title: 'Mode and language only',
    render: () => (
      <ThemeProvider presets={NAMES} defaultPreset="neutral">
        <ThemeSwitcher variant="inline" />
      </ThemeProvider>
    ),
  },
];
