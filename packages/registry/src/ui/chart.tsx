import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  ChartDataTableView,
  ChartEmpty,
  ChartSkeleton,
  type ChartDataTable,
} from '@/components/ui/chart-parts';
import {
  buildChartCss,
  chartAxisProps,
  formatChartNumber,
  sanitizeChartToken,
  seriesConfigFor,
  type ChartAxisProps,
  type ChartConfig,
} from '@/lib/chart';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'chart' | 'loading' | 'empty' | 'dataCaption' | 'category'> = {
  en: {
    chart: 'Chart',
    loading: 'Loading chart',
    empty: 'No data to display',
    dataCaption: 'Chart data',
    category: 'Category',
  },
  ar: {
    chart: 'مخطط',
    loading: 'جارٍ تحميل المخطط',
    empty: 'لا توجد بيانات للعرض',
    dataCaption: 'بيانات المخطط',
    category: 'الفئة',
  },
};

const ChartContext = createContext<{ config: ChartConfig } | null>(null);

/** Config of the surrounding chart; empty outside one so the content parts still render. */
function useChartConfig(): ChartConfig {
  return useContext(ChartContext)?.config ?? {};
}

/**
 * Supplies a series config to the tooltip and legend parts without a
 * container; `ChartContainer` already does this, so you rarely need it.
 */
function ChartConfigProvider({ config, children }: { config: ChartConfig; children: ReactNode }) {
  const value = useMemo(() => ({ config }), [config]);
  return <ChartContext value={value}>{children}</ChartContext>;
}

/** Axis props that follow the active language's direction (see `chartAxisProps`). */
function useChartAxes(options?: { reverseTime?: boolean }): ChartAxisProps {
  const { direction } = useLocale();
  return chartAxisProps(direction, options);
}

interface ChartContainerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Series key to label and colour. Keys become `--color-<key>` for `fill="var(--color-<key>)"`. */
  config: ChartConfig;
  /** A single recharts chart element (`<BarChart>`, `<LineChart>`…). */
  children: ComponentProps<typeof ResponsiveContainer>['children'];
  /** Accessible name of the chart (`role="img"`). */
  label?: string;
  /**
   * Expose the plot as a single image (`role="img"`, default). An image's
   * children are presentational, so turn it off (`false`) when the chart holds
   * focusable or interactive parts, or when the surrounding card already names
   * it: no wrapper is rendered and `label` is not announced, so name the
   * container yourself (`aria-label`, or a heading with `aria-labelledby`).
   * The `summary` and `dataTable` still render as screen-reader text.
   */
  image?: boolean;
  /** Longer plain-language description for screen readers, e.g. the trend in one sentence. */
  summary?: string;
  /** Renders the data as a visually hidden table for screen readers. */
  dataTable?: ChartDataTable;
  loading?: boolean;
  /** Shows the empty state instead of the chart. */
  empty?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  /** Size to use before the container is measured (server render, tests). */
  initialDimension?: { width: number; height: number };
}

/**
 * Themed wrapper for a recharts chart. It declares each series colour as a
 * CSS variable (`--color-<key>`), draws axes and grid in token colours, and
 * is exposed to assistive tech as an image with a name, an optional summary
 * and an optional hidden data table. Loading and empty are first-class.
 */
function ChartContainer({
  id,
  className,
  children,
  config,
  label,
  image = true,
  summary,
  dataTable,
  loading = false,
  empty = false,
  loadingLabel,
  emptyLabel,
  initialDimension,
  ...props
}: ChartContainerProps) {
  const labels = useLabels(messages, {
    ...(label ? { chart: label } : {}),
    ...(loadingLabel ? { loading: loadingLabel } : {}),
    ...(emptyLabel ? { empty: emptyLabel } : {}),
  });
  const generated = useId();
  const chartId = `chart-${sanitizeChartToken(id ?? generated)}`;
  const summaryId = `${chartId}-summary`;
  const css = buildChartCss(chartId, config);
  const plot = (
    <ResponsiveContainer width="100%" height="100%" initialDimension={initialDimension}>
      {children}
    </ResponsiveContainer>
  );

  return (
    <ChartConfigProvider config={config}>
      <div
        data-slot="chart"
        data-chart={chartId}
        aria-busy={loading || undefined}
        className={cn(
          'relative flex aspect-video min-h-48 w-full justify-center text-b3',
          '[&_.recharts-cartesian-axis-tick_text]:fill-text-muted',
          '[&_.recharts-cartesian-grid_line]:stroke-stroke-subtle',
          '[&_.recharts-polar-grid_*]:stroke-stroke-subtle',
          '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-stroke-strong',
          '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-hover-row',
          '[&_.recharts-radial-bar-background-sector]:fill-hover-row',
          '[&_.recharts-reference-line_line]:stroke-stroke',
          '[&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden',
          className,
        )}
        {...props}
      >
        {css ? <style>{css}</style> : null}
        {loading ? (
          <ChartSkeleton label={labels.loading} />
        ) : empty ? (
          <ChartEmpty label={labels.empty} />
        ) : (
          <>
            {image ? (
              <div
                role="img"
                aria-label={labels.chart}
                aria-describedby={summary ? summaryId : undefined}
                className="size-full"
              >
                {plot}
              </div>
            ) : (
              plot
            )}
            {summary ? (
              <p id={summaryId} className="sr-only">
                {summary}
              </p>
            ) : null}
            {dataTable ? (
              <ChartDataTableView
                table={dataTable}
                config={config}
                fallbackCaption={labels.dataCaption}
                fallbackCategory={labels.category}
              />
            ) : null}
          </>
        )}
      </div>
    </ChartConfigProvider>
  );
}

const ChartTooltip = RechartsTooltip;
const ChartLegend = RechartsLegend;

interface TooltipItem {
  value?: number | string;
  name?: string | number;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipContentProps {
  /** Injected by recharts. */
  active?: boolean;
  payload?: readonly TooltipItem[];
  label?: ReactNode;
  className?: string;
  indicator?: 'dot' | 'line' | 'dashed';
  hideLabel?: boolean;
  hideIndicator?: boolean;
  /** Series property to name rows by (e.g. a pie's `name`). Defaults to the item's name / data key. */
  nameKey?: string;
  /** Formats the heading, usually a date or category. */
  labelFormatter?: (label: ReactNode, payload: readonly TooltipItem[]) => ReactNode;
  /** Formats each value. Defaults to Latin digits with grouping. */
  valueFormatter?: (value: number | string, item: TooltipItem) => ReactNode;
}

/** Tooltip body in popover tokens; values always render as Latin, left-to-right numerals. */
function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  nameKey,
  labelFormatter,
  valueFormatter,
}: ChartTooltipContentProps) {
  const config = useChartConfig();
  if (!active || !payload?.length) {
    return null;
  }

  const first = payload[0];
  const headingConfig =
    typeof label === 'string'
      ? config[label]
      : seriesConfigFor(config, first, String(first?.dataKey ?? 'value'));
  const headingContent = labelFormatter
    ? labelFormatter(headingConfig?.label ?? label, payload)
    : (headingConfig?.label ?? label);
  const showHeading =
    !hideLabel && headingContent !== undefined && headingContent !== null && headingContent !== '';

  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        'grid min-w-32 items-start gap-field rounded-lg border border-stroke bg-popover px-inline py-field text-b3 text-popover-foreground shadow-large',
        className,
      )}
    >
      {showHeading ? <div className="text-label text-text-primary">{headingContent}</div> : null}
      <ul className="gap-field grid">
        {payload.map((item, index) => {
          const key = String(
            nameKey ? (item.payload?.[nameKey] ?? nameKey) : (item.name ?? item.dataKey ?? 'value'),
          );
          const series = seriesConfigFor(config, item, key);
          const swatch = item.payload?.fill;
          const color = typeof swatch === 'string' ? swatch : item.color;
          const Icon = series?.icon;
          return (
            <li key={String(item.dataKey ?? index)} className="gap-field flex items-center">
              {Icon ? (
                <Icon />
              ) : hideIndicator ? null : (
                // Inline colour is intentional: the series colour is only known at runtime.
                <span
                  aria-hidden="true"
                  data-indicator={indicator}
                  className={cn('shrink-0 rounded-[2px]', {
                    'size-2.5': indicator === 'dot',
                    'h-3 w-1': indicator === 'line',
                    'h-3 w-0 border-[1.5px] border-dashed': indicator === 'dashed',
                  })}
                  style={
                    indicator === 'dashed' ? { borderColor: color } : { backgroundColor: color }
                  }
                />
              )}
              <span className="text-text-muted flex-1">{series?.label ?? item.name}</span>
              {item.value !== undefined && item.value !== null ? (
                <span dir="ltr" className="text-label text-text-primary tabular-nums">
                  {valueFormatter
                    ? valueFormatter(item.value, item)
                    : formatChartNumber(item.value)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface LegendItem {
  value?: ReactNode;
  dataKey?: string | number;
  color?: string;
}

interface ChartLegendContentProps {
  /** Injected by recharts. */
  payload?: readonly LegendItem[];
  verticalAlign?: 'top' | 'middle' | 'bottom';
  className?: string;
  hideIcon?: boolean;
  /** Item property holding the series key when it is not the data key (a pie's `value`). */
  nameKey?: string;
}

/** Legend that reads each series' label from the chart config. */
function ChartLegendContent({
  payload,
  verticalAlign = 'bottom',
  className,
  hideIcon = false,
  nameKey,
}: ChartLegendContentProps) {
  const config = useChartConfig();
  if (!payload?.length) {
    return null;
  }

  return (
    <ul
      data-slot="chart-legend"
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-row gap-y-field',
        verticalAlign === 'top' ? 'pb-inline' : 'pt-inline',
        className,
      )}
    >
      {payload.map((item, index) => {
        const key = String(nameKey ? nameKey : (item.dataKey ?? item.value ?? 'value'));
        const series = seriesConfigFor(config, item, key);
        const Icon = series?.icon;
        return (
          <li
            key={String(item.dataKey ?? item.value ?? index)}
            className="gap-field text-b3 text-text-secondary flex items-center"
          >
            {Icon && !hideIcon ? (
              <Icon />
            ) : hideIcon ? null : (
              // Inline colour is intentional: the series colour is only known at runtime.
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            {series?.label ?? item.value}
          </li>
        );
      })}
    </ul>
  );
}

export {
  ChartConfigProvider,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartAxes,
};
export type { ChartContainerProps, ChartDataTable };
