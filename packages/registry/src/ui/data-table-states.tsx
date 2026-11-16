import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { iconTileVariants } from '@/components/ui/empty-state';
import { AlertTriangleIcon, SearchIcon } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
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
      className={cn(
        'flex min-h-56 flex-col items-center justify-center gap-row px-row py-page text-center',
        className,
      )}
    >
      <span aria-hidden="true" className={iconTileVariants({ tone: 'danger' })}>
        <AlertTriangleIcon />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-h4 text-text-primary">{labels.errorTitle}</p>
        {message ? <p className="text-b2 text-text-secondary">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
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
      className={cn(
        'flex min-h-56 flex-col items-center justify-center gap-row px-row py-page text-center',
        className,
      )}
    >
      <span aria-hidden="true" className={iconTileVariants({ tone: 'neutral' })}>
        <SearchIcon />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-h4 text-text-secondary">{title ?? labels.emptyTitle}</p>
        {description ? <p className="text-b2 text-text-muted">{description}</p> : null}
      </div>
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

const SKELETON_WIDTHS = ['w-32', 'w-44', 'w-24', 'w-36', 'w-28', 'w-40'] as const;

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
          className="h-[62px] hover:bg-transparent"
        >
          {Array.from({ length: Math.max(columnCount, 1) }, (_cell, column) => (
            <TableCell key={column}>
              <Skeleton
                className={cn(
                  'h-3.5 max-w-full',
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
          className="gap-field border-stroke bg-surface p-row flex flex-col rounded-xl border"
        >
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
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
