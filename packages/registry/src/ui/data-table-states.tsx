import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, InboxIcon } from '@/components/ui/icons';
import { TableCell, TableRow } from '@/components/ui/table';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'errorTitle' | 'retry' | 'emptyTitle'> = {
  en: {
    errorTitle: 'Could not load the data',
    retry: 'Retry',
    emptyTitle: 'No results',
  },
  ar: {
    errorTitle: 'تعذر تحميل البيانات',
    retry: 'إعادة المحاولة',
    emptyTitle: 'لا توجد نتائج',
  },
};

type DataTableStateLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface DataTableErrorProps {
  /** What went wrong, when the cause is worth showing. */
  message?: ReactNode;
  onRetry?: () => void;
  labels?: DataTableStateLabels;
  className?: string;
}

/** Error message with a retry button; used inside the table body and in the card list. */
function DataTableErrorPanel({
  message,
  onRetry,
  labels: overrides,
  className,
}: DataTableErrorProps) {
  const labels = useLabels(messages, overrides);
  return (
    <div
      role="alert"
      data-slot="data-table-error"
      className={cn('flex flex-col items-center gap-field px-row py-page text-center', className)}
    >
      <AlertTriangleIcon className="text-danger size-6" />
      <p className="text-h5 text-text-primary">{labels.errorTitle}</p>
      {message ? <p className="text-b2 text-text-muted">{message}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {labels.retry}
        </Button>
      ) : null}
    </div>
  );
}

interface DataTableEmptyProps {
  title?: ReactNode;
  description?: ReactNode;
  /** A call to action, for example a "Create" button or "Clear filters". */
  action?: ReactNode;
  labels?: DataTableStateLabels;
  className?: string;
}

/** Empty state with custom text and an optional action. */
function DataTableEmptyPanel({
  title,
  description,
  action,
  labels: overrides,
  className,
}: DataTableEmptyProps) {
  const labels = useLabels(messages, overrides);
  return (
    <div
      data-slot="data-table-empty"
      className={cn('flex flex-col items-center gap-field px-row py-page text-center', className)}
    >
      <InboxIcon className="text-text-muted size-6" />
      <p className="text-h5 text-text-primary">{title ?? labels.emptyTitle}</p>
      {description ? <p className="text-b2 text-text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

/** A full-width body row that holds a state panel, so the header and columns stay in place. */
function DataTableStateRow({
  columnCount,
  children,
}: {
  columnCount: number;
  children: ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={Math.max(columnCount, 1)}>{children}</TableCell>
    </TableRow>
  );
}

const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-1/3'] as const;

/** Placeholder rows with the real column count, so the layout does not shift when data arrives. */
function DataTableSkeletonRows({
  columnCount,
  rowCount,
}: {
  columnCount: number;
  rowCount: number;
}) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, row) => (
        <TableRow
          key={row}
          aria-hidden="true"
          data-slot="data-table-skeleton-row"
          className="hover:bg-transparent"
        >
          {Array.from({ length: Math.max(columnCount, 1) }, (_cell, column) => (
            <TableCell key={column}>
              <div
                className={cn(
                  'h-4 animate-pulse rounded-md bg-surface-dim motion-reduce:animate-none',
                  SKELETON_WIDTHS[(row + column) % SKELETON_WIDTHS.length],
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Placeholder cards for the mobile layout. */
function DataTableSkeletonCards({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: rowCount }, (_, row) => (
        <li
          key={row}
          aria-hidden="true"
          data-slot="data-table-skeleton-card"
          className="gap-field border-stroke bg-surface p-row flex flex-col rounded-lg border"
        >
          <div className="bg-surface-dim h-5 w-1/2 animate-pulse rounded-md motion-reduce:animate-none" />
          <div className="bg-surface-dim h-4 w-3/4 animate-pulse rounded-md motion-reduce:animate-none" />
          <div className="bg-surface-dim h-4 w-2/3 animate-pulse rounded-md motion-reduce:animate-none" />
        </li>
      ))}
    </>
  );
}

export {
  DataTableEmptyPanel,
  DataTableErrorPanel,
  DataTableSkeletonCards,
  DataTableSkeletonRows,
  DataTableStateRow,
};
export type { DataTableEmptyProps, DataTableErrorProps, DataTableStateLabels };
