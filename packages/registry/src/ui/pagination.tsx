import { Button } from '@/components/ui/button';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { getPageCount, getPageWindow, getRowRange } from '@/lib/page-window';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'navigation'
  | 'first'
  | 'previous'
  | 'next'
  | 'last'
  | 'page'
  | 'pageStatus'
  | 'showing'
  | 'noResults'
  | 'rowsPerPage'
> = {
  en: {
    navigation: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    page: 'Page {page}',
    pageStatus: 'Page {page} of {pageCount}',
    showing: 'Showing {from}–{to} of {total}',
    noResults: 'No results',
    rowsPerPage: 'Rows per page',
  },
  ar: {
    navigation: 'ترقيم الصفحات',
    first: 'الصفحة الأولى',
    previous: 'الصفحة السابقة',
    next: 'الصفحة التالية',
    last: 'الصفحة الأخيرة',
    page: 'الصفحة {page}',
    pageStatus: 'الصفحة {page} من {pageCount}',
    showing: 'عرض {from}–{to} من {total}',
    noResults: 'لا توجد نتائج',
    rowsPerPage: 'عدد الصفوف',
  },
};

type PaginationLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  /** Number of pages. Or give `total` and `pageSize` and it is derived. */
  pageCount?: number;
  /** Total number of rows across all pages (enables the "showing a–b of N" text). */
  total?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Choices for the page-size select; the select shows only with `onPageSizeChange`. */
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
  /** Page numbers shown on each side of the current page. */
  siblings?: number;
  /** Locks every control, for example while the next page loads. */
  disabled?: boolean;
  labels?: PaginationLabels;
  className?: string;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100] as const;

/**
 * Server-driven pagination: it never slices data, it only reports the page the
 * user asked for. Counts use Latin digits in both languages, and the chevrons
 * mirror in RTL while "next" always means the following page.
 */
function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onPageSizeChange,
  siblings = 1,
  disabled = false,
  labels: labelOverrides,
  className,
}: PaginationProps) {
  const labels = useLabels(messages, labelOverrides);
  const resolvedCount =
    pageCount ??
    (total !== undefined && pageSize !== undefined ? getPageCount(total, pageSize) : 1);
  const current = Math.min(Math.max(page, 1), resolvedCount);
  const range =
    total !== undefined && pageSize !== undefined ? getRowRange(current, pageSize, total) : null;
  const isFirst = current <= 1;
  const isLast = current >= resolvedCount;
  const pageStatus = fillTemplate(labels.pageStatus, {
    page: formatCount(current),
    pageCount: formatCount(resolvedCount),
  });

  const sizeChoices =
    pageSize !== undefined && !pageSizeOptions.includes(pageSize)
      ? [...pageSizeOptions, pageSize].sort((a, b) => a - b)
      : pageSizeOptions;

  function go(target: number) {
    if (!disabled && target !== current && target >= 1 && target <= resolvedCount) {
      onPageChange(target);
    }
  }

  const stepButton = 'max-sm:size-11';

  return (
    <nav
      aria-label={labels.navigation}
      data-slot="pagination"
      className={cn(
        'flex flex-wrap items-center justify-between gap-row text-b2 text-text-secondary',
        className,
      )}
    >
      <div className="gap-row flex flex-wrap items-center">
        {total !== undefined && pageSize !== undefined ? (
          <p data-slot="pagination-summary" className="tabular-nums">
            {range
              ? fillTemplate(labels.showing, {
                  from: formatCount(range.from),
                  to: formatCount(range.to),
                  total: formatCount(total),
                })
              : labels.noResults}
          </p>
        ) : null}
        {onPageSizeChange && pageSize !== undefined ? (
          <div className="gap-field flex items-center">
            <span aria-hidden="true">{labels.rowsPerPage}</span>
            <Select
              aria-label={labels.rowsPerPage}
              className="w-20"
              disabled={disabled}
              value={String(pageSize)}
              options={sizeChoices.map((size) => ({
                value: String(size),
                label: formatCount(size),
              }))}
              onValueChange={(value) => {
                if (value !== null) {
                  onPageSizeChange(Number(value));
                }
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className={stepButton}
          aria-label={labels.first}
          disabled={disabled || isFirst}
          onClick={() => go(1)}
        >
          <ChevronsLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className={stepButton}
          aria-label={labels.previous}
          disabled={disabled || isFirst}
          onClick={() => go(current - 1)}
        >
          <ChevronLeftIcon />
        </Button>

        <ol className="hidden items-center gap-1 sm:flex">
          {getPageWindow(current, resolvedCount, siblings).map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <Button
                  variant={item === current ? 'default' : 'ghost'}
                  size="icon-sm"
                  aria-label={fillTemplate(labels.page, {
                    page: formatCount(item),
                  })}
                  aria-current={item === current ? 'page' : undefined}
                  disabled={disabled}
                  className="tabular-nums"
                  onClick={() => go(item)}
                >
                  {formatCount(item)}
                </Button>
              </li>
            ) : (
              <li key={item} aria-hidden="true" className="text-text-muted px-1">
                …
              </li>
            ),
          )}
        </ol>
        <span className="px-field tabular-nums sm:hidden" aria-hidden="true">
          {pageStatus}
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          className={stepButton}
          aria-label={labels.next}
          disabled={disabled || isLast}
          onClick={() => go(current + 1)}
        >
          <ChevronRightIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className={stepButton}
          aria-label={labels.last}
          disabled={disabled || isLast}
          onClick={() => go(resolvedCount)}
        >
          <ChevronsRightIcon />
        </Button>
      </div>
      <span role="status" className="sr-only">
        {pageStatus}
      </span>
    </nav>
  );
}

export { Pagination };
export type { PaginationLabels, PaginationProps };
