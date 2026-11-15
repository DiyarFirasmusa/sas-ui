import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { LocaleProvider, type Locale } from '@/lib/locale';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  locale?: Locale;
}

/** Renders inside the locale provider and mirrors dir/lang on <html>. */
export function renderWithLocale(
  ui: ReactElement,
  { locale = 'en', ...options }: Options = {},
) {
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = locale;
  return render(ui, {
    wrapper: ({ children }) => (
      <LocaleProvider locale={locale}>{children}</LocaleProvider>
    ),
    ...options,
  });
}
