import { describe, expect, it } from 'vitest';
import { APPLICATION_STAGES } from '@/components/blocks/detail-page-01-data';
import {
  activityLabel,
  messages,
  stageLabel,
  statusLabel,
  typeLabel,
} from '@/components/blocks/detail-page-01-messages';

describe('detail-page-01 messages', () => {
  it('defines every key in both languages', () => {
    expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.values(messages.ar).every((text) => text.length > 0)).toBe(true);
  });

  it('names every stage, status, type and activity kind', () => {
    const labels = messages.ar;
    expect(APPLICATION_STAGES.map((stage) => stageLabel(labels, stage))).toEqual([
      'تم التقديم',
      'فحص المستندات',
      'المراجعة الفنية',
      'الاعتماد',
      'تم الإصدار',
    ]);
    expect(statusLabel(messages.en, 'in-review')).toBe('In review');
    expect(typeLabel(messages.en, 'vehicle')).toBe('Vehicle');
    expect(activityLabel(messages.en, 'rejected')).toBe('Stage rejected');
  });
});
