import { describe, expect, it } from 'vitest';
import { areaSample, barSample, lineSample, pieSample } from '@/components/blocks/chart-samples';

describe('chart samples', () => {
  it.each(['en', 'ar'] as const)('are complete in %s', (locale) => {
    [areaSample(locale), barSample(locale), lineSample(locale)].forEach((sample) => {
      expect(sample.data).toHaveLength(6);
      expect(Object.keys(sample.config)).toEqual(['desktop', 'mobile']);
      expect(sample.title.length).toBeGreaterThan(0);
      expect(sample.trend.text.length).toBeGreaterThan(0);
    });
    const pie = pieSample(locale);
    expect(pie.slices.map((slice) => slice.id)).toEqual(Object.keys(pie.config));
    expect(pie.slices.every((slice) => slice.value > 0)).toBe(true);
  });

  it('writes the Arabic sample in Arabic, keeping the digits Latin', () => {
    expect(areaSample('ar').title).toMatch(/[؀-ۿ]/);
    expect(areaSample('ar').data[0]?.month).toMatch(/[؀-ۿ]/);
    expect(areaSample('ar').trend.text).toContain('5.2%');
    expect(areaSample('en').title).not.toMatch(/[؀-ۿ]/);
  });
});
