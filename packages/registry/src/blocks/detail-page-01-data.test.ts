import { describe, expect, it } from 'vitest';
import {
  APPLICATION_STAGES,
  clampStage,
  formatDateTime,
  formatDay,
  sampleApplication,
} from '@/components/blocks/detail-page-01-data';

describe('detail-page-01 data', () => {
  it('keeps the sample inside the workflow and newest activity first', () => {
    expect(sampleApplication.stage).toBeLessThan(APPLICATION_STAGES.length);
    const times = sampleApplication.activity.map((entry) => Date.parse(entry.at));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('clamps a bad stage index', () => {
    expect(clampStage(-4)).toBe(0);
    expect(clampStage(99)).toBe(APPLICATION_STAGES.length - 1);
    expect(clampStage(2.7)).toBe(2);
  });

  it('formats dates with Latin digits in both languages', () => {
    expect(formatDateTime('2026-11-05T11:02:00Z', 'ar')).toMatch(/2026/);
    expect(formatDateTime('2026-11-05T11:02:00Z', 'en')).toMatch(/Nov/);
    expect(formatDay('2026-11-27', 'ar')).toMatch(/27/);
    expect(formatDay('2026-11-27', 'ar')).not.toMatch(/[٠-٩]/);
  });

  it('shows unparseable values as written instead of "Invalid Date"', () => {
    expect(formatDateTime('soon', 'en')).toBe('soon');
    expect(formatDay('2026-02-31', 'en')).toBe('2026-02-31');
  });
});
