import { describe, expect, it } from 'vitest';
import { commandMessages } from '@/lib/command-messages';

describe('commandMessages', () => {
  it('has the same keys in English and Arabic', () => {
    expect(Object.keys(commandMessages.ar).sort()).toEqual(Object.keys(commandMessages.en).sort());
  });

  it('has no empty label', () => {
    for (const locale of [commandMessages.en, commandMessages.ar]) {
      for (const label of Object.values(locale)) {
        expect(label.trim()).not.toBe('');
      }
    }
  });
});
