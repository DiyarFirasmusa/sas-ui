import { Fragment, createElement, useCallback, type ReactNode } from 'react';
import type { Locale } from '@/lib/locale';
import { useDocsSettings } from '../docs-settings';
import { isMessageKey, messages, type MessageKey } from './messages';

export type TValues = Record<string, string | number>;
export type TFunction = (key: MessageKey, values?: TValues) => string;

/** Fills `{name}` placeholders; a placeholder without a value is left as written. */
export function interpolate(template: string, values?: TValues): string {
  if (!values) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

/** Translation outside React (tests, search keywords). */
export function translate(locale: Locale, key: MessageKey, values?: TValues): string {
  return interpolate(messages[locale][key], values);
}

/** The text of a key in every language, space-separated — for search matching. */
export function allLocales(key: MessageKey): string {
  return `${messages.en[key]} ${messages.ar[key]}`;
}

/**
 * Like `t`, but placeholders may be React nodes (a `<strong>`, a `<code>`):
 * `renderRich(t('tokens.showing'), { preset: <strong>…</strong> })`.
 */
export function renderRich(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template
    .split(/(\{\w+\})/)
    .filter((part) => part !== '')
    .map((part, index) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1];
      const node = name === undefined ? part : name in nodes ? nodes[name] : part;
      return createElement(Fragment, { key: index }, node);
    });
}

/** The docs site's translator for the language chosen in the header. */
export function useT(): TFunction {
  const { locale } = useDocsSettings();
  return useCallback((key, values) => translate(locale, key, values), [locale]);
}

/** Title of a registry category ("form" → "Forms" / "النماذج"); unknown ones show as written. */
export function categoryTitle(t: TFunction, category: string): string {
  const key = `category.${category}`;
  return isMessageKey(key) ? t(key) : category;
}

/** Description of a preset in the active language (the preset file only carries English). */
export function presetDescription(
  t: TFunction,
  preset: { name: string; description: string },
): string {
  const key = `preset.${preset.name}`;
  return isMessageKey(key) ? t(key) : preset.description;
}
