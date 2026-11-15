import { DirectionProvider } from '@base-ui/react/direction-provider';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type Locale = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

/** Labels per locale; every locale must define every key. */
export type Messages<Keys extends string> = Record<Locale, Record<Keys, string>>;

interface LocaleValue {
  locale: Locale;
  direction: Direction;
}

function detectLocale(): Locale {
  if (typeof document === 'undefined') {
    return 'en';
  }
  return document.documentElement.lang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function directionOf(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Provides the UI language and text direction to library components. Without
 * it they fall back to <html lang> (and Base UI to left-to-right). Components never hardcode a string: each ships its own
 * ar/en defaults and accepts overrides through a `labels` prop.
 */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, direction: directionOf(locale) }), [locale]);
  // Base UI reads text direction from its own provider (not <html dir>), so
  // popups, sliders and arrow-key navigation mirror correctly for every component.
  return (
    <LocaleContext value={value}>
      <DirectionProvider direction={value.direction}>{children}</DirectionProvider>
    </LocaleContext>
  );
}

export function useLocale(): LocaleValue {
  const context = useContext(LocaleContext);
  if (context) {
    return context;
  }
  const locale = detectLocale();
  return { locale, direction: directionOf(locale) };
}

/**
 * Resolves a component's labels: its ar/en defaults for the active locale,
 * overridden key by key by the caller's `labels` prop.
 */
export function useLabels<Keys extends string>(
  messages: Messages<Keys>,
  overrides?: Partial<Record<Keys, string>>,
): Record<Keys, string> {
  const { locale } = useLocale();
  return { ...messages[locale], ...overrides };
}
