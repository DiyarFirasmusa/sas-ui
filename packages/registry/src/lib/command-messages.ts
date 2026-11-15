import type { Messages } from '@/lib/locale';

/** Labels shared by every part of the command palette. */
export const commandMessages: Messages<
  'palette' | 'search' | 'placeholder' | 'results' | 'empty' | 'loading'
> = {
  en: {
    palette: 'Command palette',
    search: 'Search',
    placeholder: 'Type a command or search…',
    results: 'Results',
    empty: 'No results found.',
    loading: 'Loading…',
  },
  ar: {
    palette: 'لوحة الأوامر',
    search: 'بحث',
    placeholder: 'اكتب أمراً أو ابحث…',
    results: 'النتائج',
    empty: 'لا توجد نتائج.',
    loading: 'جارٍ التحميل…',
  },
};
