import { describe, expect, it } from 'vitest';
import {
  buildChartCss,
  chartAxisProps,
  chartSeriesColor,
  formatChartNumber,
  resolveSeriesColors,
  sanitizeChartColor,
  sanitizeChartToken,
  seriesConfigFor,
} from '@/lib/chart';

describe('chartSeriesColor', () => {
  it('cycles --chart-1..5', () => {
    expect(chartSeriesColor(0)).toBe('var(--chart-1)');
    expect(chartSeriesColor(4)).toBe('var(--chart-5)');
    expect(chartSeriesColor(5)).toBe('var(--chart-1)');
    expect(chartSeriesColor(7)).toBe('var(--chart-3)');
    expect(chartSeriesColor(-1)).toBe('var(--chart-5)');
  });
});

describe('sanitising', () => {
  it('keeps tokens to a CSS-safe alphabet', () => {
    expect(sanitizeChartToken('a b}{;c-1_x')).toBe('abc-1_x');
  });

  it('accepts plain colours and rejects anything that could escape a declaration', () => {
    expect(sanitizeChartColor('#12ab34')).toBe('#12ab34');
    expect(sanitizeChartColor('rgb(10, 20, 30)')).toBe('rgb(10, 20, 30)');
    expect(sanitizeChartColor('oklch(60% 0.2 30)')).toBe('oklch(60% 0.2 30)');
    expect(sanitizeChartColor('var(--primary)')).toBe('var(--primary)');
    expect(sanitizeChartColor('rebeccapurple')).toBe('rebeccapurple');
    expect(sanitizeChartColor('red; } body { display: none')).toBeUndefined();
    expect(sanitizeChartColor('url(https://x.test/a.png)')).toBeUndefined();
    expect(sanitizeChartColor(undefined)).toBeUndefined();
  });
});

describe('resolveSeriesColors / buildChartCss', () => {
  const config = {
    sales: { label: 'Sales' },
    cost: { label: 'Cost', color: 'var(--danger)' },
    broken: { label: 'Broken', color: 'red;}' },
  };

  it('defaults to the palette in config order and honours explicit colours', () => {
    expect(resolveSeriesColors(config)).toEqual({
      sales: 'var(--chart-1)',
      cost: 'var(--danger)',
      broken: 'var(--chart-3)',
    });
  });

  it('emits one scoped rule', () => {
    const css = buildChartCss('chart-x1', config);
    expect(css).toContain('[data-chart=chart-x1]');
    expect(css).toContain('--color-sales: var(--chart-1);');
    expect(css).toContain('--color-cost: var(--danger);');
    expect(css).not.toContain('red;}');
  });

  it('is empty for an empty config', () => {
    expect(buildChartCss('c', {})).toBe('');
  });
});

describe('formatChartNumber', () => {
  it('uses Latin digits with grouping', () => {
    expect(formatChartNumber(1234567)).toBe('1,234,567');
    expect(formatChartNumber('1500')).toBe('1,500');
    expect(formatChartNumber(0)).toBe('0');
    expect(formatChartNumber(12.5)).toBe('12.5');
  });

  it('renders anything non-numeric as an em dash', () => {
    expect(formatChartNumber('')).toBe('—');
    expect(formatChartNumber('abc')).toBe('—');
    expect(formatChartNumber(Number.NaN)).toBe('—');
    expect(formatChartNumber(undefined)).toBe('—');
    expect(formatChartNumber(null)).toBe('—');
  });
});

describe('chartAxisProps', () => {
  it('keeps the value axis at the left in LTR', () => {
    expect(chartAxisProps('ltr')).toEqual({
      xAxis: { reversed: false },
      yAxis: { orientation: 'left' },
    });
  });

  it('moves the value axis to the right and reverses time in RTL', () => {
    expect(chartAxisProps('rtl')).toEqual({
      xAxis: { reversed: true },
      yAxis: { orientation: 'right' },
    });
  });

  it('can keep categorical order in RTL', () => {
    expect(chartAxisProps('rtl', { reverseTime: false }).xAxis.reversed).toBe(false);
  });
});

describe('seriesConfigFor', () => {
  const config = { desktop: { label: 'Desktop' }, mobile: { label: 'Mobile' } };

  it('finds a series by data key', () => {
    expect(seriesConfigFor(config, { dataKey: 'desktop' }, 'desktop')).toEqual(config.desktop);
  });

  it('reads the category name from the item or its row', () => {
    expect(seriesConfigFor(config, { name: 'mobile' }, 'name')).toEqual(config.mobile);
    expect(seriesConfigFor(config, { payload: { browser: 'desktop' } }, 'browser')).toEqual(
      config.desktop,
    );
  });

  it('returns undefined for unknown keys and non-objects', () => {
    expect(seriesConfigFor(config, { name: 'x' }, 'name')).toBeUndefined();
    expect(seriesConfigFor(config, null, 'name')).toBeUndefined();
  });
});
