import { PRESETS } from '@sas-ui/tokens/all-presets';
import {
  applyDirection,
  applyMode,
  applyPreset,
  getStoredMode,
  getStoredPreset,
  type ColorMode,
} from '@sas-ui/tokens/apply-preset';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocaleProvider, type Direction, type Locale } from '@/lib/locale';

interface DocsSettings {
  preset: string;
  mode: ColorMode;
  locale: Locale;
  direction: Direction;
  setPreset: (name: string) => void;
  setMode: (mode: ColorMode) => void;
  setLocale: (locale: Locale) => void;
  setDirection: (direction: Direction) => void;
  /** Bumps whenever the theme changes so token views re-read computed values. */
  themeVersion: number;
}

const SettingsContext = createContext<DocsSettings | null>(null);

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage is only a convenience here
  }
}

export function DocsSettingsProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState(() => getStoredPreset('neutral'));
  const [mode, setMode] = useState<ColorMode>(() => getStoredMode());
  const [locale, setLocale] = useState<Locale>(() =>
    readStored('sas-ui:lang') === 'ar' ? 'ar' : 'en',
  );
  const [direction, setDirection] = useState<Direction>(() => {
    const stored = readStored('sas-ui:dir');
    return stored === 'rtl' || stored === 'ltr'
      ? stored
      : readStored('sas-ui:lang') === 'ar'
        ? 'rtl'
        : 'ltr';
  });
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    applyPreset(preset);
    setThemeVersion((version) => version + 1);
  }, [preset]);

  useEffect(() => {
    applyMode(mode);
    setThemeVersion((version) => version + 1);
    if (mode !== 'system') {
      return;
    }
    const query = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mode]);

  useEffect(() => {
    applyDirection(direction, locale);
    writeStored('sas-ui:lang', locale);
    writeStored('sas-ui:dir', direction);
  }, [direction, locale]);

  const value = useMemo<DocsSettings>(
    () => ({
      preset,
      mode,
      locale,
      direction,
      themeVersion,
      setPreset,
      setMode,
      // Switching language also flips direction; the direction control can still override it.
      setLocale: (next) => {
        setLocale(next);
        setDirection(next === 'ar' ? 'rtl' : 'ltr');
      },
      setDirection,
    }),
    [preset, mode, locale, direction, themeVersion],
  );

  return (
    <SettingsContext value={value}>
      <LocaleProvider locale={locale}>{children}</LocaleProvider>
    </SettingsContext>
  );
}

export function useDocsSettings(): DocsSettings {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useDocsSettings must be used inside DocsSettingsProvider');
  }
  return context;
}

export const PRESET_OPTIONS = PRESETS.map((preset) => ({
  value: preset.name,
  label: preset.label.en,
}));
