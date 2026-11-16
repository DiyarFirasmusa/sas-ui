import type { Locale } from '@/lib/locale';
import { ITEMS_AR } from './items-ar';

/** The item with its Arabic title and description when the locale is Arabic and the text exists. */
export function localizeItem<T extends { name: string; title: string; description: string }>(
  item: T,
  locale: Locale,
): T {
  const arabic = locale === 'ar' ? ITEMS_AR[item.name] : undefined;
  return arabic ? { ...item, title: arabic.title, description: arabic.description } : item;
}
