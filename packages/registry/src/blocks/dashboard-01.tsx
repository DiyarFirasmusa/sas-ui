import { useState, type ReactNode } from 'react';
import { ChartArea01 } from '@/components/blocks/chart-area-01';
import { ChartBar01 } from '@/components/blocks/chart-bar-01';
import type { ChartRow, ChartTrend } from '@/components/blocks/chart-data';
import {
  DASHBOARD_RANGES,
  RANGE_DAYS,
  dashboardSample,
  periodChange,
  revenueRows,
  type ActivityItem,
  type CategoryPoint,
  type DashboardRange,
  type DashboardStat,
  type RecordRow,
  type RevenuePoint,
} from '@/components/blocks/dashboard-01-data';
import {
  ActivityCard,
  RecordsCard,
  type RecordsCardProps,
} from '@/components/blocks/dashboard-01-panels';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'title'
  | 'subtitle'
  | 'range'
  | 'range7d'
  | 'range30d'
  | 'range90d'
  | 'revenueTitle'
  | 'revenueDescription'
  | 'revenue'
  | 'date'
  | 'trendUp'
  | 'trendDown'
  | 'trendFlat'
  | 'categoryTitle'
  | 'categoryDescription'
  | 'category'
  | 'sales'
  | 'returns'
  | 'stats'
> = {
  en: {
    title: 'Overview',
    subtitle: 'How the business is doing',
    range: 'Time range',
    range7d: '7 days',
    range30d: '30 days',
    range90d: '90 days',
    revenueTitle: 'Revenue',
    revenueDescription: 'Daily revenue over the last {days} days',
    revenue: 'Revenue',
    date: 'Date',
    trendUp: 'Up {percent}% on the previous {days} days',
    trendDown: 'Down {percent}% on the previous {days} days',
    trendFlat: 'Unchanged from the previous {days} days',
    categoryTitle: 'Sales by category',
    categoryDescription: 'Sales and returns per category',
    category: 'Category',
    sales: 'Sales',
    returns: 'Returns',
    stats: 'Key figures',
  },
  ar: {
    title: 'نظرة عامة',
    subtitle: 'كيف يسير العمل',
    range: 'المدى الزمني',
    range7d: '7 أيام',
    range30d: '30 يوماً',
    range90d: '90 يوماً',
    revenueTitle: 'الإيرادات',
    revenueDescription: 'الإيرادات اليومية خلال آخر {days} يوماً',
    revenue: 'الإيرادات',
    date: 'التاريخ',
    trendUp: 'ارتفاع بنسبة {percent}% عن الـ {days} يوماً السابقة',
    trendDown: 'انخفاض بنسبة {percent}% عن الـ {days} يوماً السابقة',
    trendFlat: 'دون تغيير عن الـ {days} يوماً السابقة',
    categoryTitle: 'المبيعات حسب الفئة',
    categoryDescription: 'المبيعات والمرتجعات لكل فئة',
    category: 'الفئة',
    sales: 'المبيعات',
    returns: 'المرتجعات',
    stats: 'الأرقام الرئيسية',
  },
};

function isRange(value: unknown): value is DashboardRange {
  return DASHBOARD_RANGES.some((range) => range === value);
}

interface Dashboard01Props extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Four to five KPI tiles. Leave out for the sample; `[]` shows none. */
  stats?: readonly DashboardStat[];
  /** Daily revenue, oldest first. `[]` shows the chart's empty state. */
  revenue?: readonly RevenuePoint[];
  categories?: readonly CategoryPoint[];
  activity?: readonly ActivityItem[];
  records?: readonly RecordRow[];
  /** Selected range of the revenue chart (controlled). */
  range?: DashboardRange;
  defaultRange?: DashboardRange;
  onRangeChange?: (range: DashboardRange) => void;
  /** Shows skeletons in every section. */
  loading?: boolean;
  /** Replaces the sections with a failure message; a string becomes the detail line. */
  error?: boolean | string;
  onRetry?: () => void;
  onRecordClick?: RecordsCardProps['onRecordClick'];
  formatAmount?: RecordsCardProps['formatAmount'];
  /** Page heading and its supporting line. */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Buttons at the end of the header, such as export or a date picker. */
  actions?: ReactNode;
}

/**
 * Analytics dashboard: KPI tiles, a revenue area chart with a 7/30/90 day
 * range, sales by category, a recent-activity timeline and a table of the
 * latest records. Each section has loading and empty states; `error` swaps
 * them all for a retryable failure. In Arabic the chart axes mirror.
 */
function Dashboard01({
  stats: statsProp,
  revenue: revenueProp,
  categories: categoriesProp,
  activity: activityProp,
  records: recordsProp,
  range: rangeProp,
  defaultRange = '30d',
  onRangeChange,
  loading = false,
  error = false,
  onRetry,
  onRecordClick,
  formatAmount,
  title,
  subtitle,
  actions,
  className,
  ...props
}: Dashboard01Props) {
  const labels = useLabels(messages);
  const { locale } = useLocale();
  const [ownRange, setOwnRange] = useState<DashboardRange>(defaultRange);
  const range = rangeProp ?? ownRange;
  const sample = dashboardSample(locale);
  const stats = statsProp ?? sample.stats;
  const revenue = revenueProp ?? sample.revenue;
  const categories = categoriesProp ?? sample.categories;
  const days = RANGE_DAYS[range];
  const rangeLabels: Record<DashboardRange, string> = {
    '7d': labels.range7d,
    '30d': labels.range30d,
    '90d': labels.range90d,
  };

  const change = periodChange(revenue, range);
  const trend: ChartTrend | undefined = change
    ? {
        direction: change.direction,
        text: fillTemplate(
          change.direction === 'up'
            ? labels.trendUp
            : change.direction === 'down'
              ? labels.trendDown
              : labels.trendFlat,
          { percent: change.percent, days },
        ),
      }
    : undefined;
  const categoryRows: ChartRow[] = categories.map((point) => ({
    category: point.category,
    sales: point.sales,
    returns: point.returns,
  }));

  const selectRange = (next: unknown) => {
    if (isRange(next)) {
      setOwnRange(next);
      onRangeChange?.(next);
    }
  };

  return (
    <div
      data-slot="dashboard-01"
      className={cn('gap-card flex w-full min-w-0 flex-col', className)}
      {...props}
    >
      <PageHeader
        title={title ?? labels.title}
        subtitle={subtitle ?? labels.subtitle}
        actions={actions}
      />

      {error ? (
        <Card>
          <CardContent>
            <ErrorState
              size="page"
              titleAs="h2"
              details={typeof error === 'string' ? error : undefined}
              onRetry={onRetry}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <section aria-label={labels.stats}>
            <StatGrid>
              {stats.map((stat) => (
                <StatCard
                  key={stat.id}
                  label={stat.label}
                  value={stat.value}
                  delta={stat.delta}
                  icon={stat.icon}
                  tone={stat.tone}
                  loading={loading}
                />
              ))}
            </StatGrid>
          </section>

          <div className="gap-row grid lg:grid-cols-3">
            <ChartArea01
              titleAs="h2"
              className="lg:col-span-2"
              title={labels.revenueTitle}
              description={fillTemplate(labels.revenueDescription, { days })}
              data={revenueRows(revenue, range)}
              config={{ revenue: { label: labels.revenue } }}
              xKey="label"
              xLabel={labels.date}
              trend={trend}
              loading={loading}
              action={
                <Tabs value={range} onValueChange={selectRange} variant="pill">
                  <TabsList aria-label={labels.range}>
                    {DASHBOARD_RANGES.map((option) => (
                      <TabsTrigger key={option} value={option}>
                        {rangeLabels[option]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              }
            />
            <ChartBar01
              titleAs="h2"
              title={labels.categoryTitle}
              description={labels.categoryDescription}
              data={categoryRows}
              config={{ sales: { label: labels.sales }, returns: { label: labels.returns } }}
              xKey="category"
              xLabel={labels.category}
              reverseTime={false}
              loading={loading}
            />
          </div>

          <div className="gap-row grid lg:grid-cols-3">
            <RecordsCard
              className="lg:col-span-2"
              records={recordsProp ?? sample.records}
              loading={loading}
              onRecordClick={onRecordClick}
              formatAmount={formatAmount}
            />
            <ActivityCard items={activityProp ?? sample.activity} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}

export { Dashboard01 };
export type { Dashboard01Props };
