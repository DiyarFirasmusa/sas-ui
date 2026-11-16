import type { ReactNode } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { ChartCard, type ChartCardProps } from '@/components/blocks/chart-card';
import {
  percentOf,
  pieTotal,
  seriesColorVar,
  seriesName,
  usePieSummary,
  type PieSlice,
} from '@/components/blocks/chart-data';
import { pieSample } from '@/components/blocks/chart-samples';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatChartNumber,
  resolveSeriesColors,
  sanitizeChartToken,
  type ChartConfig,
} from '@/lib/chart';
import { useLabels, useLocale, type Messages } from '@/lib/locale';

const messages: Messages<'total' | 'name' | 'value' | 'share' | 'caption' | 'list'> = {
  en: {
    total: 'Total',
    name: 'Name',
    value: 'Value',
    share: 'Share',
    caption: 'Chart data',
    list: 'Breakdown',
  },
  ar: {
    total: 'الإجمالي',
    name: 'الاسم',
    value: 'القيمة',
    share: 'الحصة',
    caption: 'بيانات المخطط',
    list: 'التفصيل',
  },
};

interface ChartPie01Props extends Omit<ChartCardProps, 'title' | 'children'> {
  title?: ReactNode;
  /** One slice per category. Leave it out to see the sample; pass `[]` for the empty state. */
  slices?: readonly PieSlice[];
  /** Label and colour per slice id. Defaults to the id as label. */
  config?: ChartConfig;
  /** Heading above the centre figure. Default "Total". */
  centerLabel?: string;
  /** Replaces the computed total in the centre, e.g. a formatted currency amount. */
  centerValue?: string;
  summary?: string;
  chartLabel?: string;
  loading?: boolean;
}

function configFor(slices: readonly PieSlice[]): ChartConfig {
  return Object.fromEntries(slices.map((slice) => [slice.id, { label: slice.id }]));
}

/**
 * Donut card: the total in the centre and a legend list with each slice's
 * value and share beside it. A hidden table and a one-sentence summary give
 * screen readers the same numbers. Numbers keep Latin digits.
 */
function ChartPie01({
  title,
  description,
  trend,
  footnote,
  slices: slicesProp,
  config: configProp,
  centerLabel,
  centerValue,
  summary: summaryProp,
  chartLabel,
  loading = false,
  ...card
}: ChartPie01Props) {
  const labels = useLabels(messages);
  const { locale } = useLocale();
  const sample = pieSample(locale);
  const showingSample = slicesProp === undefined;
  const slices = slicesProp ?? sample.slices;
  const config = configProp ?? (showingSample ? sample.config : configFor(slices));
  const resolvedTitle = title ?? sample.title;
  const summary = usePieSummary(slices, config);
  const total = pieTotal(slices);
  const colors = resolveSeriesColors(config);
  const empty = slices.length === 0;

  return (
    <ChartCard
      {...card}
      title={resolvedTitle}
      description={description ?? (showingSample ? sample.description : undefined)}
      trend={trend ?? (showingSample ? sample.trend : undefined)}
      footnote={footnote ?? (showingSample ? sample.footnote : undefined)}
    >
      <div className="gap-row grid items-center sm:grid-cols-2">
        <div className="relative">
          <ChartContainer
            config={config}
            label={chartLabel ?? (typeof resolvedTitle === 'string' ? resolvedTitle : undefined)}
            summary={summaryProp ?? summary}
            loading={loading}
            empty={empty}
            className="mx-auto aspect-square max-h-64"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="id" />} />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="id"
                innerRadius="62%"
                outerRadius="90%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {slices.map((slice) => (
                  <Cell key={slice.id} fill={seriesColorVar(slice.id)} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          {loading || empty ? null : (
            <div
              data-slot="chart-pie-center"
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
            >
              <span dir="ltr" className="text-h3 text-text-primary tabular-nums">
                {centerValue ?? formatChartNumber(total)}
              </span>
              <span className="text-b3 text-text-muted">{centerLabel ?? labels.total}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="gap-inline flex flex-col" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>
        ) : empty ? null : (
          <>
            <ul
              aria-label={labels.list}
              className="gap-field flex flex-col"
              data-slot="chart-pie-legend"
            >
              {slices.map((slice) => (
                <li key={slice.id} className="gap-field text-b2 flex items-center">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-[2px]"
                    // Inline colour is intentional: series colours resolve at runtime from the config.
                    style={{ backgroundColor: colors[sanitizeChartToken(slice.id)] }}
                  />
                  <span dir="auto" className="text-text-secondary min-w-0 flex-1 truncate">
                    {seriesName(config, slice.id)}
                  </span>
                  <span dir="ltr" className="text-label text-text-primary tabular-nums">
                    {formatChartNumber(slice.value)}
                  </span>
                  <span dir="ltr" className="text-b3 text-text-muted w-12 text-end tabular-nums">
                    {percentOf(slice.value, total)}%
                  </span>
                </li>
              ))}
            </ul>
            <table className="sr-only" data-slot="chart-data-table">
              <caption>{labels.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{labels.name}</th>
                  <th scope="col">{labels.value}</th>
                  <th scope="col">{labels.share}</th>
                </tr>
              </thead>
              <tbody>
                {slices.map((slice) => (
                  <tr key={slice.id}>
                    <th scope="row">{seriesName(config, slice.id)}</th>
                    <td>{formatChartNumber(slice.value)}</td>
                    <td>{percentOf(slice.value, total)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </ChartCard>
  );
}

export { ChartPie01 };
export type { ChartPie01Props };
