import type { ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@/components/ui/icons';
import { TableCell, TableRow } from '@/components/ui/table';
import type { GridCellProps } from '@/hooks/use-data-table-grid';
import { formatCount } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'groupRows' | 'groupEmpty'> = {
  en: { groupRows: 'rows', groupEmpty: 'No value' },
  ar: { groupRows: 'صفوف', groupEmpty: 'بدون قيمة' },
};

type DataTableGroupLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

/** How a group's value reads when the caller gave no `renderGroupLabel`. */
function defaultGroupLabel(value: unknown, emptyLabel: string): string {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? emptyLabel : value.toISOString().slice(0, 10);
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

interface DataTableGroupRowProps {
  /** Width of the header cell: the number of visible columns. */
  columnCount: number;
  /** The group's value, shown as its name. */
  value: unknown;
  /** Replaces the default text for the value (a translated status, a formatted date). */
  label?: ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  /** Totals for the group, shown at the end of the header row. */
  aggregates?: ReactNode;
  cellProps?: GridCellProps;
  rowProps?: { 'aria-rowindex'?: number; style?: { height: number } };
  labels?: DataTableGroupLabels;
}

/**
 * The header row of a group: a button that expands and collapses it
 * (`aria-expanded`, Enter and Space), the group's name, its row count in
 * Latin digits and optional aggregates.
 */
function DataTableGroupRow({
  columnCount,
  value,
  label,
  count,
  expanded,
  onToggle,
  aggregates,
  cellProps,
  rowProps,
  labels: overrides,
}: DataTableGroupRowProps) {
  const labels = useLabels(messages, overrides);
  const Chevron = expanded ? ChevronDownIcon : ChevronRightIcon;
  const { className, ...cell } = cellProps ?? {};
  return (
    <TableRow
      data-slot="data-table-group"
      className="bg-surface-dim hover:bg-surface-dim"
      {...rowProps}
    >
      <TableCell colSpan={columnCount} className={cn('py-1', className)} {...cell}>
        <div className="gap-inline flex flex-wrap items-center justify-between">
          <button
            type="button"
            aria-expanded={expanded}
            data-slot="data-table-group-toggle"
            onClick={onToggle}
            className="gap-field text-h5 text-text-primary hover:bg-hover-row focus-visible:ring-ring -mx-2 inline-flex min-h-8 items-center rounded-md px-2 outline-none focus-visible:ring-2"
          >
            <Chevron className="text-text-muted size-4" />
            <span dir="auto">{label ?? defaultGroupLabel(value, labels.groupEmpty)}</span>{' '}
            <span
              dir="ltr"
              className="rounded-pill border-stroke bg-surface text-b3 text-text-secondary border px-2 tabular-nums"
            >
              {formatCount(count)}
            </span>{' '}
            <span className="sr-only">{labels.groupRows}</span>
          </button>
          {aggregates ? <div className="text-b2 text-text-secondary">{aggregates}</div> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export { DataTableGroupRow, defaultGroupLabel };
export type { DataTableGroupLabels, DataTableGroupRowProps };
