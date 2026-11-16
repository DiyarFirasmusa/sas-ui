import type { ReactNode } from 'react';
import type { ChartCardProps } from '@/components/blocks/chart-card';
import {
  deriveConfig,
  seriesKeys,
  useSeriesSummary,
  type ChartRow,
} from '@/components/blocks/chart-data';
import type { CartesianSample } from '@/components/blocks/chart-samples';
import type { ChartDataTable } from '@/components/ui/chart';
import type { ChartConfig } from '@/lib/chart';
import { useLabels, useLocale, type Locale, type Messages } from '@/lib/locale';

const messages: Messages<'category'> = {
  en: { category: 'Category' },
  ar: { category: 'الفئة' },
};

interface CartesianChartProps extends Omit<ChartCardProps, 'title' | 'children'> {
  title?: ReactNode;
  /** One row per x position. Leave it out to see the sample; pass `[]` for the empty state. */
  data?: readonly ChartRow[];
  /** Label and colour per series key. Derived from the numeric properties of `data` when omitted. */
  config?: ChartConfig;
  /** Row property holding the category (month, date, name). Default `month`. */
  xKey?: string;
  /** Header of the category column in the screen-reader table. */
  xLabel?: string;
  /** Plain-language description for screen readers; generated from the data when omitted. */
  summary?: string;
  /** Accessible name of the chart; defaults to the title when it is text. */
  chartLabel?: string;
  loading?: boolean;
  /** Time runs right to left in Arabic. Set false for categories that are not a sequence. */
  reverseTime?: boolean;
}

interface ResolvedCartesian {
  /** Props for `ChartCard`, minus its children. */
  card: Omit<ChartCardProps, 'children'>;
  data: readonly ChartRow[];
  config: ChartConfig;
  keys: string[];
  xKey: string;
  summary: string;
  chartLabel: string | undefined;
  loading: boolean;
  empty: boolean;
  reverseTime: boolean;
  dataTable: ChartDataTable;
}

/**
 * Settles what a cartesian chart block shows: the caller's data and config,
 * or the localised sample, plus the generated summary and data table. The
 * three cartesian blocks share it so they behave the same.
 */
function useCartesianBlock(
  props: CartesianChartProps,
  sampleFor: (locale: Locale) => CartesianSample,
): ResolvedCartesian {
  const {
    title,
    data: dataProp,
    config: configProp,
    xKey = 'month',
    xLabel,
    summary: summaryProp,
    chartLabel,
    loading = false,
    reverseTime = true,
    description,
    trend,
    footnote,
    ...card
  } = props;
  const { locale } = useLocale();
  const labels = useLabels(messages);
  const sample = sampleFor(locale);
  const showingSample = dataProp === undefined;
  const data = dataProp ?? sample.data;
  const config = configProp ?? (showingSample ? sample.config : deriveConfig(data, xKey));
  const generated = useSeriesSummary(data, xKey, config);
  const resolvedTitle = title ?? sample.title;

  return {
    card: {
      ...card,
      title: resolvedTitle,
      description: description ?? (showingSample ? sample.description : undefined),
      trend: trend ?? (showingSample ? sample.trend : undefined),
      footnote: footnote ?? (showingSample ? sample.footnote : undefined),
    },
    data,
    config,
    keys: seriesKeys(config),
    xKey,
    summary: summaryProp ?? generated,
    chartLabel: chartLabel ?? (typeof resolvedTitle === 'string' ? resolvedTitle : undefined),
    loading,
    empty: data.length === 0,
    reverseTime,
    dataTable: { data, categoryKey: xKey, categoryLabel: xLabel ?? labels.category },
  };
}

export { useCartesianBlock };
export type { CartesianChartProps, ResolvedCartesian };
