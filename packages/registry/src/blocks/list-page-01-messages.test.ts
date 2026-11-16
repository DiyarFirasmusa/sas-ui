import { describe, expect, it } from 'vitest';
import { LICENCE_STATUSES, LICENCE_TYPES } from '@/components/blocks/list-page-01-data';
import { messages, statusLabelKey, typeLabelKey } from '@/components/blocks/list-page-01-messages';

describe('list-page-01 messages', () => {
  it('defines every key in both languages', () => {
    expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.values(messages.ar).every((text) => text.length > 0)).toBe(true);
  });

  it('has a label for every status and type', () => {
    for (const status of LICENCE_STATUSES) {
      expect(messages.en[statusLabelKey(status)]).toBeTruthy();
    }
    for (const type of LICENCE_TYPES) {
      expect(messages.ar[typeLabelKey(type)]).toBeTruthy();
    }
  });
});
