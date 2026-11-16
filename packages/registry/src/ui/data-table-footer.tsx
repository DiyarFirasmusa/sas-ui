import { Pagination, type PaginationLabels } from '@/components/ui/pagination';

interface DataTablePagination {
  /** Current page, 1-based. */
  page: number;
  pageSize: number;
  /** Total rows on the server; the page count is derived from it. */
  total?: number;
  pageCount?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
}

interface DataTableFooterProps {
  pagination: DataTablePagination;
  disabled?: boolean;
  /** Runs before a page or page-size change, so the table can drop a selection that no longer applies. */
  onBeforeChange?: () => void;
  labels?: PaginationLabels;
}

/** The pagination row under the table. */
function DataTableFooter({
  pagination,
  disabled = false,
  onBeforeChange,
  labels,
}: DataTableFooterProps) {
  const { onPageSizeChange } = pagination;
  return (
    <Pagination
      page={pagination.page}
      pageSize={pagination.pageSize}
      total={pagination.total}
      pageCount={pagination.pageCount}
      disabled={disabled}
      pageSizeOptions={pagination.pageSizeOptions}
      onPageSizeChange={
        onPageSizeChange
          ? (size) => {
              onBeforeChange?.();
              onPageSizeChange(size);
            }
          : undefined
      }
      onPageChange={(page) => {
        onBeforeChange?.();
        pagination.onPageChange(page);
      }}
      labels={labels}
    />
  );
}

export { DataTableFooter };
export type { DataTableFooterProps, DataTablePagination };
