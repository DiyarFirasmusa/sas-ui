import { InboxIcon } from '@/components/ui/icons';
import { formatChartNumber, type ChartConfig } from '@/lib/chart';
import { cn } from '@/lib/utils';

interface ChartDataTable {
  /** The rows the chart plots. */
  data: readonly Record<string, unknown>[];
  /** Row property holding the category (x value, month, name…). */
  categoryKey: string;
  categoryLabel?: string;
  caption?: string;
}

const SKELETON_BARS = ['h-2/5', 'h-3/5', 'h-4/5', 'h-1/2', 'h-full', 'h-3/5'];

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      data-slot="chart-skeleton"
      className="gap-inline px-inline flex size-full items-end"
    >
      {SKELETON_BARS.map((height, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            'flex-1 animate-pulse rounded-md bg-hover-row motion-reduce:animate-none',
            height,
          )}
        />
      ))}
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div
      data-slot="chart-empty"
      className="gap-field text-b2 text-text-muted flex size-full flex-col items-center justify-center"
    >
      <InboxIcon className="size-6" />
      <p>{label}</p>
    </div>
  );
}

function ChartDataTableView({
  table,
  config,
  fallbackCaption,
  fallbackCategory,
}: {
  table: ChartDataTable;
  config: ChartConfig;
  fallbackCaption: string;
  fallbackCategory: string;
}) {
  const keys = Object.keys(config);
  return (
    <table className="sr-only" data-slot="chart-data-table">
      <caption>{table.caption ?? fallbackCaption}</caption>
      <thead>
        <tr>
          <th scope="col">{table.categoryLabel ?? fallbackCategory}</th>
          {keys.map((key) => (
            <th key={key} scope="col">
              {config[key]?.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.data.map((row, index) => (
          <tr key={index}>
            <th scope="row">{String(row[table.categoryKey] ?? '')}</th>
            {keys.map((key) => (
              <td key={key}>{formatChartNumber(row[key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export { ChartDataTableView, ChartEmpty, ChartSkeleton };
export type { ChartDataTable };
