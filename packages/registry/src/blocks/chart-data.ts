import { formatChartNumber, sanitizeChartToken, type ChartConfig } from '@/lib/chart';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';

/** One x position of a cartesian chart: the category plus a number per series. */
interface ChartRow {
  [key: string]: string | number;
}

/** One slice of a donut: an id that keys the chart config, and its value. */
interface PieSlice {
  id: string;
  value: number;
}

interface ChartTrend {
  direction: 'up' | 'down' | 'flat';
  /** The sentence shown in the footer, e.g. "Up 5.2% this month". It carries the meaning, not just the icon. */
  text: string;
  /** Whether the change is good news; defaults from the direction (up is positive). */
  tone?: 'positive' | 'negative' | 'neutral';
}

const messages: Messages<'series' | 'pie' | 'slice' | 'empty'> = {
  en: {
    series:
      '{name}: from {first} in {firstLabel} to {last} in {lastLabel}. Highest {max} in {maxLabel}, lowest {min} in {minLabel}.',
    pie: 'Total {total}. {parts}',
    slice: '{name} {value} ({percent}%)',
    empty: 'No data to display.',
  },
  ar: {
    series:
      '{name}: من {first} في {firstLabel} إلى {last} في {lastLabel}. الأعلى {max} في {maxLabel}، والأدنى {min} في {minLabel}.',
    pie: 'الإجمالي {total}. {parts}',
    slice: '{name} {value} ({percent}%)',
    empty: 'لا توجد بيانات للعرض.',
  },
};

/** `var(--color-<key>)` for a series, with the key reduced to the alphabet the chart stylesheet allows. */
function seriesColorVar(key: string): string {
  return `var(--color-${sanitizeChartToken(key)})`;
}

/** Series keys of a config, in order. */
function seriesKeys(config: ChartConfig): string[] {
  return Object.keys(config);
}

/** Plain-text name of a series: a string label as is, anything richer falls back to the key. */
function seriesName(config: ChartConfig, key: string): string {
  const label = config[key]?.label;
  return typeof label === 'string' ? label : key;
}

/** Config for data given without one: every numeric property becomes a series named by its key. */
function deriveConfig(data: readonly ChartRow[], xKey: string): ChartConfig {
  const config: ChartConfig = {};
  data.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (key !== xKey && typeof value === 'number' && !(key in config)) {
        config[key] = { label: key };
      }
    });
  });
  return config;
}

function numberAt(row: ChartRow | undefined, key: string): number {
  const value = row?.[key];
  return typeof value === 'number' ? value : 0;
}

/** Extremes and ends of one series, in the words a screen reader should hear. */
function describeSeries(
  data: readonly ChartRow[],
  xKey: string,
  key: string,
  name: string,
  template: string,
): string {
  const first = data[0];
  const last = data.at(-1);
  const values = data.map((row) => numberAt(row, key));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const label = (row: ChartRow | undefined) => String(row?.[xKey] ?? '');
  return fillTemplate(template, {
    name,
    first: formatChartNumber(numberAt(first, key)),
    firstLabel: label(first),
    last: formatChartNumber(numberAt(last, key)),
    lastLabel: label(last),
    max: formatChartNumber(max),
    maxLabel: label(data[values.indexOf(max)]),
    min: formatChartNumber(min),
    minLabel: label(data[values.indexOf(min)]),
  });
}

/** Default screen-reader description of a cartesian chart: one sentence per series. */
function useSeriesSummary(data: readonly ChartRow[], xKey: string, config: ChartConfig): string {
  const labels = useLabels(messages);
  if (data.length === 0) {
    return labels.empty;
  }
  return seriesKeys(config)
    .map((key) => describeSeries(data, xKey, key, seriesName(config, key), labels.series))
    .join(' ');
}

function pieTotal(slices: readonly PieSlice[]): number {
  return slices.reduce((sum, slice) => sum + slice.value, 0);
}

/** Share of the total as one-decimal text with a Latin digit; `0.0` when the total is zero. */
function percentOf(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
}

/** Default screen-reader description of a donut: the total and each slice's value and share. */
function usePieSummary(slices: readonly PieSlice[], config: ChartConfig): string {
  const labels = useLabels(messages);
  if (slices.length === 0) {
    return labels.empty;
  }
  const total = pieTotal(slices);
  const parts = slices
    .map((slice) =>
      fillTemplate(labels.slice, {
        name: seriesName(config, slice.id),
        value: formatChartNumber(slice.value),
        percent: percentOf(slice.value, total),
      }),
    )
    .join('; ');
  return fillTemplate(labels.pie, { total: formatChartNumber(total), parts });
}

export {
  deriveConfig,
  describeSeries,
  percentOf,
  pieTotal,
  seriesColorVar,
  seriesKeys,
  seriesName,
  usePieSummary,
  useSeriesSummary,
};
export type { ChartRow, ChartTrend, PieSlice };
