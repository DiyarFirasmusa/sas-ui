import { describe, expect, it } from 'vitest';
import {
  actionCopy,
  closedLabel,
  decisionLabel,
  messages,
  outcomeLabel,
} from '@/components/blocks/approval-01-messages';

describe('approval-01 messages', () => {
  it('defines every key in both languages', () => {
    expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.values(messages.ar).every((text) => text.length > 0)).toBe(true);
  });

  it('names every decision, outcome and closed state', () => {
    expect(decisionLabel(messages.en, 'returned')).toBe('Returned for changes');
    expect(outcomeLabel(messages.ar, 'approved')).toBe('معتمد');
    expect(closedLabel(messages.en, 'rejected')).toMatch(/rejected/);
    expect(closedLabel(messages.en, 'returned')).toMatch(/returned/);
  });

  it('has dialog copy for each action', () => {
    expect(actionCopy(messages.en, 'approve').button).toBe('Approve');
    expect(actionCopy(messages.en, 'reject').title).toBe('Reject this request');
    expect(actionCopy(messages.ar, 'return').button).toBe('إعادة');
  });
});
