import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LocaleProvider, directionOf, type Direction, type Locale } from '@/lib/locale';
import {
  DARK_QUERY,
  applyLocale,
  applyMode,
  applyPreset,
  getStoredLocale,
  getStoredMode,
  getStoredPreset,
  resolveMode,
  storeLocale,
  storeMode,
  storePreset,
  systemPrefersDark,
  type ColorMode,
} from '@/lib/theme';

interface ThemeContextValue {
  /** Preset names the app offers (the CSS for each is already on the page). */
  presets: readonly string[];
  preset: string;
  setPreset: (preset: string) => void;
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  /** What `mode` currently resolves to; differs from `mode` only for `system`. */
  resolvedMode: 'light' | 'dark';
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: Direction;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  /** Preset names, in display order. The first one is the default unless `defaultPreset` is set. */
  presets: readonly string[];
  defaultPreset?: string;
  defaultMode?: ColorMode;
  defaultLocale?: Locale;
  /** Set false to keep choices in memory only (previews, tests). Default true. */
  persist?: boolean;
  children: ReactNode;
}

// useLayoutEffect warns during server rendering; the effect only touches <html>.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Owns the three app-wide appearance choices — preset, light/dark/system mode
 * and language — and mirrors them onto <html> (`data-preset`, `dark` class,
 * `dir`, `lang`). It also provides the locale to every library component, so
 * switching language flips labels and direction together. Choices persist to
 * localStorage; pair it with `noFlashScript()` in <head> to avoid a flash.
 */
function ThemeProvider({
  presets,
  defaultPreset,
  defaultMode = 'system',
  defaultLocale = 'en',
  persist = true,
  children,
}: ThemeProviderProps) {
  const fallbackPreset = defaultPreset ?? presets[0] ?? '';
  const [preset, setPresetState] = useState(() =>
    persist ? getStoredPreset(fallbackPreset, presets) : fallbackPreset,
  );
  const [mode, setModeState] = useState<ColorMode>(() =>
    persist ? getStoredMode(defaultMode) : defaultMode,
  );
  const [locale, setLocaleState] = useState<Locale>(() =>
    persist ? getStoredLocale(defaultLocale) : defaultLocale,
  );
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const query = globalThis.matchMedia?.(DARK_QUERY);
    if (!query) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches);
    };
    setSystemDark(query.matches);
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
    };
  }, []);

  const resolvedMode = resolveMode(mode, systemDark);

  useIsomorphicLayoutEffect(() => {
    applyPreset(preset);
  }, [preset]);
  useIsomorphicLayoutEffect(() => {
    applyMode(resolvedMode);
  }, [resolvedMode]);
  useIsomorphicLayoutEffect(() => {
    applyLocale(locale);
  }, [locale]);

  const setPreset = useCallback(
    (next: string) => {
      if (!presets.includes(next)) {
        return;
      }
      setPresetState(next);
      if (persist) {
        storePreset(next);
      }
    },
    [presets, persist],
  );
  const setMode = useCallback(
    (next: ColorMode) => {
      setModeState(next);
      if (persist) {
        storeMode(next);
      }
    },
    [persist],
  );
  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      if (persist) {
        storeLocale(next);
      }
    },
    [persist],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      presets,
      preset,
      setPreset,
      mode,
      setMode,
      resolvedMode,
      locale,
      setLocale,
      direction: directionOf(locale),
    }),
    [presets, preset, setPreset, mode, setMode, resolvedMode, locale, setLocale],
  );

  return (
    <ThemeContext value={value}>
      <LocaleProvider locale={locale}>{children}</LocaleProvider>
    </ThemeContext>
  );
}

function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return context;
}

export { ThemeProvider, useTheme };
export type { ThemeContextValue, ThemeProviderProps };
