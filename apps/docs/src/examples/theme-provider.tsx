import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';
import { noFlashScript } from '@/lib/theme';
import type { Example } from '../example-types';

const PRESETS = ['neutral', 'hr', 'inventory', 'wine-lapis'];

/** The provider owns <html>; put back what the docs page had when the demo unmounts. */
function RestoreRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const before = {
      preset: root.dataset.preset,
      dark: root.classList.contains('dark'),
      dir: root.dir,
      lang: root.lang,
      scheme: root.style.colorScheme,
    };
    return () => {
      if (before.preset === undefined) {
        delete root.dataset.preset;
      } else {
        root.dataset.preset = before.preset;
      }
      root.classList.toggle('dark', before.dark);
      root.dir = before.dir;
      root.lang = before.lang;
      root.style.colorScheme = before.scheme;
    };
  }, []);
  return children;
}

function Readout() {
  const theme = useTheme();
  return (
    <div className="gap-field text-b1 flex flex-col">
      <p>
        Preset: <strong>{theme.preset}</strong> · Mode: <strong>{theme.mode}</strong> (shows{' '}
        <strong>{theme.resolvedMode}</strong>) · Language: <strong>{theme.locale}</strong> (
        <strong>{theme.direction}</strong>)
      </p>
      <div className="gap-field flex flex-wrap">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant={theme.preset === preset ? 'default' : 'outline'}
            onClick={() => theme.setPreset(preset)}
          >
            {preset}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => theme.setMode(theme.resolvedMode === 'dark' ? 'light' : 'dark')}
        >
          Toggle dark
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => theme.setLocale(theme.locale === 'ar' ? 'en' : 'ar')}
        >
          Toggle language
        </Button>
      </div>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Provider and useTheme',
    description:
      'Writes data-preset, the dark class, dir and lang on <html> and persists them. This demo changes the whole docs page and restores it when you leave.',
    render: () => (
      <RestoreRoot>
        <ThemeProvider presets={PRESETS} defaultPreset="neutral" persist={false}>
          <Readout />
        </ThemeProvider>
      </RestoreRoot>
    ),
  },
  {
    title: 'No-flash script',
    description: 'Inline this in <head> so the stored theme applies before first paint.',
    render: () => (
      <pre
        className="border-stroke bg-surface-dim p-row text-b3 max-w-full overflow-x-auto rounded-lg border"
        dir="ltr"
      >
        {noFlashScript('neutral', 'en')}
      </pre>
    ),
  },
];
