import type { ComponentType, ReactNode } from 'react';
import type { Direction } from '@/lib/locale';

/** One series (or category): how it is named and which colour it takes. */
export interface ChartSeriesConfig {
  label: ReactNode;
  /** Any plain CSS colour or `var(--token)`. Defaults to `--chart-1..5` in config order. */
  color?: string;
  icon?: ComponentType;
}

export type ChartConfig = Record<string, ChartSeriesConfig>;

/** The theme ships five chart colours; a sixth series wraps back to the first. */
export const CHART_SERIES_COUNT = 5;

export function chartSeriesColor(index: number): string {
  const slot = ((index % CHART_SERIES_COUNT) + CHART_SERIES_COUNT) % CHART_SERIES_COUNT;
  return `var(--chart-${slot + 1})`;
}

/** Keys and ids reach a stylesheet selector, so they keep to a CSS-safe alphabet. */
export function sanitizeChartToken(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Only plain colour values may be written into the injected stylesheet:
 * hex, functional notations with numeric arguments, `var(--token)` or a named
 * colour. Anything else (urls, semicolons, braces) is dropped.
 */
const SAFE_COLOR =
  /^(#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([0-9\s.,%+/-]+(?:deg|rad|turn)?[0-9\s.,%+/-]*\)|var\(--[a-zA-Z0-9_-]+\)|[a-zA-Z]{3,20})$/;

export function sanitizeChartColor(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return SAFE_COLOR.test(trimmed) ? trimmed : undefined;
}

/** `--color-<key>` value per series, applying the default palette to uncoloured ones. */
export function resolveSeriesColors(config: ChartConfig): Record<string, string> {
  const colors: Record<string, string> = {};
  Object.entries(config).forEach(([rawKey, series], index) => {
    const key = sanitizeChartToken(rawKey);
    if (key === '') {
      return;
    }
    const configured = sanitizeChartColor(series.color);
    colors[key] = configured ?? chartSeriesColor(index);
  });
  return colors;
}

/**
 * The scoped declarations that expose every series as `--color-<key>`, so
 * charts write `fill="var(--color-sales)"` and a legend, a tooltip and the
 * bars all agree. Returns '' when there is nothing to declare.
 */
export function buildChartCss(chartId: string, config: ChartConfig): string {
  const colors = Object.entries(resolveSeriesColors(config));
  if (colors.length === 0) {
    return '';
  }
  const declarations = colors.map(([key, color]) => `  --color-${key}: ${color};`).join('\n');
  return `[data-chart=${sanitizeChartToken(chartId)}] {\n${declarations}\n}`;
}

/** Latin digits and grouping in both languages, whatever the browser locale. */
const NUMBER_FORMAT = new Intl.NumberFormat('en-US');
const EMPTY_VALUE = '—';

/** Non-numeric or empty values render as an em dash, never as "NaN". */
export function formatChartNumber(value: unknown): string {
  if (typeof value === 'string' && value.trim() === '') {
    return EMPTY_VALUE;
  }
  if (typeof value !== 'number' && typeof value !== 'string') {
    return EMPTY_VALUE;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? NUMBER_FORMAT.format(numeric) : EMPTY_VALUE;
}

export interface ChartAxisProps {
  /** Spread onto `<XAxis>`. */
  xAxis: { reversed: boolean };
  /** Spread onto `<YAxis>`. */
  yAxis: { orientation: 'left' | 'right' };
}

/**
 * Axis props that follow the reading direction: in RTL the value axis sits at
 * the inline start (the right edge) and, for time series, time runs right to
 * left. Pass `reverseTime: false` for categorical X axes that should keep
 * their data order.
 */
export function chartAxisProps(
  direction: Direction,
  { reverseTime = true }: { reverseTime?: boolean } = {},
): ChartAxisProps {
  const rtl = direction === 'rtl';
  return {
    xAxis: { reversed: rtl && reverseTime },
    yAxis: { orientation: rtl ? 'right' : 'left' },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Finds the config entry for a recharts payload item. The key is read from the
 * item (or its `payload` row) when that holds a string — pie slices name their
 * category that way — and otherwise used as given.
 */
export function seriesConfigFor(
  config: ChartConfig,
  item: unknown,
  key: string,
): ChartSeriesConfig | undefined {
  if (!isRecord(item)) {
    return undefined;
  }
  const row = isRecord(item.payload) ? item.payload : undefined;
  const direct = item[key];
  const nested = row?.[key];
  const resolved = typeof direct === 'string' ? direct : typeof nested === 'string' ? nested : key;
  return config[resolved] ?? config[key];
}
