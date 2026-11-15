import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '@/lib/locale';
import { items, loadExamples } from './catalog';

/**
 * Every documented example must render in both languages without throwing —
 * the docs site is the public face of the library, so a broken example is a bug.
 */
describe('docs examples', () => {
  const names = items.map((item) => item.name);

  it('lists every registry item', () => {
    expect(names.length).toBeGreaterThan(50);
  });

  it('has live examples for every component (ui items)', async () => {
    const missing: string[] = [];
    for (const item of items.filter((entry) => entry.type === 'ui')) {
      const module = await loadExamples(item.name);
      if (!module || module.examples.length === 0) {
        missing.push(item.name);
      }
    }
    expect(missing).toEqual([]);
  });

  it.each(names)('%s examples render in English and Arabic', async (name) => {
    const module = await loadExamples(name);
    for (const locale of ['en', 'ar'] as const) {
      for (const example of module?.examples ?? []) {
        const { unmount } = render(
          <LocaleProvider locale={locale}>{example.render()}</LocaleProvider>,
        );
        expect(document.body.textContent, `${name} / ${example.title} / ${locale}`).not.toBeNull();
        unmount();
      }
    }
  });
});
