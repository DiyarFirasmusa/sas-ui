import { describe, expect, it } from 'vitest';
import {
  dashboardSample,
  periodChange,
  revenueRows,
  type RevenuePoint,
} from '@/components/blocks/dashboard-01-data';

const points: RevenuePoint[] = Array.from({ length: 20 }, (_, index) => ({
  label: `d${index}`,
  revenue: index < 10 ? 100 : 150,
}));

describe('dashboard data helpers', () => {
  it('takes the last N days for the selected range, oldest first', () => {
    const rows = revenueRows(points, '7d');
    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual({ label: 'd13', revenue: 150 });
    expect(rows.at(-1)).toEqual({ label: 'd19', revenue: 150 });
    expect(revenueRows(points.slice(-3), '30d')).toHaveLength(3);
  });

  it('compares a period with the one before it', () => {
    const flat = Array.from({ length: 14 }, (_, index) => ({ label: String(index), revenue: 100 }));
    expect(periodChange(flat, '7d')).toEqual({ percent: 0, direction: 'flat' });
    const doubling = Array.from({ length: 14 }, (_, index) => ({
      label: String(index),
      revenue: index < 7 ? 100 : 150,
    }));
    expect(periodChange(doubling, '7d')).toEqual({ percent: 50, direction: 'up' });
    const falling = Array.from({ length: 14 }, (_, index) => ({
      label: String(index),
      revenue: index < 7 ? 200 : 150,
    }));
    expect(periodChange(falling, '7d')).toEqual({ percent: 25, direction: 'down' });
  });

  it('gives no change without enough history or a revenue-free earlier period', () => {
    expect(periodChange(points, '30d')).toBeNull();
    const zero = Array.from({ length: 14 }, (_, index) => ({
      label: String(index),
      revenue: index < 7 ? 0 : 150,
    }));
    expect(periodChange(zero, '7d')).toBeNull();
  });

  it.each(['en', 'ar'] as const)('provides complete sample data in %s', (locale) => {
    const sample = dashboardSample(locale);
    expect(sample.stats).toHaveLength(4);
    expect(sample.stats.every((stat) => stat.value.length > 0 && stat.delta)).toBe(true);
    expect(sample.revenue).toHaveLength(180);
    expect(sample.revenue.every((point) => point.revenue > 0)).toBe(true);
    expect(sample.categories).toHaveLength(5);
    expect(sample.activity).toHaveLength(4);
    expect(sample.records).toHaveLength(5);
    expect(periodChange(sample.revenue, '90d')).not.toBeNull();
  });

  it('writes Arabic dates with Latin digits', () => {
    const label = dashboardSample('ar').revenue.at(-1)?.label ?? '';
    expect(label).toMatch(/\d/);
    expect(label).not.toMatch(/[٠-٩]/);
    expect(label).toMatch(/[؀-ۿ]/);
    expect(dashboardSample('ar').stats[0]?.label).toMatch(/[؀-ۿ]/);
  });
});
