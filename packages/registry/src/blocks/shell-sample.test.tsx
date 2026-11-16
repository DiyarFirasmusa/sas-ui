import { describe, expect, it } from 'vitest';
import {
  sampleCommands,
  sampleNav,
  sampleNotifications,
  sampleUser,
} from '@/components/blocks/shell-sample';
import { flattenNavItems } from '@/lib/nav-utils';

describe('shell sample data', () => {
  it.each(['en', 'ar'] as const)('is complete in %s', (locale) => {
    const nav = sampleNav(locale);
    const ids = flattenNavItems(nav).map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(flattenNavItems(nav).every((item) => item.label.length > 0)).toBe(true);
    expect(sampleUser(locale).name.length).toBeGreaterThan(0);
    expect(sampleNotifications(locale).filter((item) => item.read !== true).length).toBeGreaterThan(
      0,
    );
    expect(sampleCommands(locale).length).toBeGreaterThan(0);
  });

  it('uses Arabic text for the Arabic sample', () => {
    expect(sampleNav('ar')[0]?.label).toMatch(/[؀-ۿ]/);
    expect(sampleNav('en')[0]?.label).not.toMatch(/[؀-ۿ]/);
  });
});
