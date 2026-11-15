import {
  functionalUpdate,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useEffect, useMemo, type ReactNode } from 'react';
import { DataTableBody } from '@/components/ui/data-table-body';
import type { MobileCardContext } from '@/components/ui/data-table-cards';
import { DataTableHeaderCell } from '@/components/ui/data-table-header';
import { DataTableMobile } from '@/components/ui/data-table-mobile';
import { createSelectColumn, getSelectLabel } from '@/components/ui/data-table-selection';
import {
  DataTableEmptyPanel,
  DataTableErrorPanel,
  type DataTableStateLabels,
} from '@/components/ui/data-table-states';
import {
  DataTableBulkBar,
  DataTableColumnMenu,
  type DataTableToolbarLabels,
} from '@/components/ui/data-table-toolbar';
import { Pagination, type PaginationLabels } from '@/components/ui/pagination';
import { Table, TableCaption, TableHeader, TableRow } from '@/components/ui/table';
import { useDataTableState } from '@/hooks/use-data-table-state';
import { readColumnMeta, type DataTableColumnMeta } from '@/lib/data-table-meta';
import { resolveSticky, SELECT_COLUMN_ID } from '@/lib/data-table-sticky';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { getPageCount } from '@/lib/page-window';
import { cn } from '@/lib/utils';

const messages: Messages<
  'selectAll' | 'selectRow' | 'selectNamedRow' | 'selectedAnnouncement' | 'loading' | 'refreshing'
> = {
  en: {
    selectAll: 'Select all rows on this page',
    selectRow: 'Select row {number}',
    selectNamedRow: 'Select {name}',
    selectedAnnouncement: '{count} rows selected',
    loading: 'Loading',
    refreshing: 'Updating',
  },
  ar: {
    selectAll: 'تحديد كل الصفوف في هذه الصفحة',
    selectRow: 'تحديد الصف {number}',
    selectNamedRow: 'تحديد {name}',
    selectedAnnouncement: 'الصفوف المحددة: {count}',
    loading: 'جارٍ التحميل',
    refreshing: 'جارٍ التحديث',
  },
};

type DataTableLabels = Partial<Record<keyof (typeof messages)['en'], string>> &
  DataTableStateLabels &
  DataTableToolbarLabels & { pagination?: PaginationLabels };

/** What the table is showing. `empty` is derived: a successful response with no rows. */
type DataTableState =
  | { status: 'loading' }
  | { status: 'error'; message?: ReactNode; onRetry?: () => void }
  | {
      status: 'success';
      /** A later page or sort is loading: the old rows stay and a progress bar shows. */
      refetching?: boolean;
    };

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

interface DataTableEmpty {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

interface DataTableProps<TData> {
  /** Column definitions. Use `meta` (see `DataTableColumnMeta`) for alignment, sticky and card roles. */
  columns: ColumnDef<TData>[];
  /** The current page of rows, as the server returned it. */
  data: TData[];
  /** Stable id per row (never the index) so selection survives a refetch. */
  getRowId: (row: TData, index: number) => string;
  state: DataTableState;
  /** Visually hidden table name. */
  caption?: string;
  empty?: DataTableEmpty;
  pagination?: DataTablePagination;
  /** Sorting is done by the server; headers become buttons when `onSortingChange` is given. */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Adds a checkbox column with a tri-state header checkbox. */
  selectable?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  enableRowSelection?: (row: TData) => boolean;
  /** Names a row's checkbox: "Select {name}". */
  getRowLabel?: (row: TData) => string;
  /** Actions for the selected rows of this page; shown in the bar above the table. */
  bulkActions?: (selectedRows: TData[]) => ReactNode;
  /** Adds a "Columns" menu to show and hide columns. */
  columnMenu?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  /** Filters, search and other controls above the table. */
  toolbar?: ReactNode;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  stickyLastColumn?: boolean;
  /** Runs when a row is clicked (or activated with Enter). Prefer a real link in the first cell when a detail page exists. */
  onRowClick?: (row: TData) => void;
  /** `cards` shows each row as a card below the sm breakpoint; `scroll` keeps the table and scrolls it sideways. */
  mobile?: 'scroll' | 'cards';
  renderMobileCard?: (row: TData, context: MobileCardContext<TData>) => ReactNode;
  labels?: DataTableLabels;
  className?: string;
  /** Classes for the scroll container, for example `max-h-96` with `stickyHeader`. */
  containerClassName?: string;
}

const NO_ROWS: never[] = [];

/**
 * Server-driven table on TanStack Table v8: it renders the page it is given and
 * reports what the user asked for (page, sort, selection, visibility). Loading
 * shows skeleton rows, errors a retry row, and empty results your message; the
 * header and toolbar stay in place in every state.
 */
function DataTable<TData>({
  columns,
  data,
  getRowId,
  state,
  caption,
  empty,
  pagination,
  sorting,
  onSortingChange,
  selectable = false,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  enableRowSelection,
  getRowLabel,
  bulkActions,
  columnMenu = false,
  columnVisibility: visibilityProp,
  onColumnVisibilityChange,
  toolbar,
  stickyHeader = false,
  stickyFirstColumn = false,
  stickyLastColumn = false,
  onRowClick,
  mobile = 'scroll',
  renderMobileCard,
  labels: labelOverrides,
  className,
  containerClassName,
}: DataTableProps<TData>) {
  const labels = useLabels(messages, labelOverrides);
  const {
    rowSelection,
    columnVisibility,
    setSelection,
    handleSelectionChange,
    handleVisibilityChange,
    clearSelectionIfAny,
  } = useDataTableState({
    selectable,
    rowSelection: rowSelectionProp,
    onRowSelectionChange,
    columnVisibility: visibilityProp,
    onColumnVisibilityChange,
  });
  const isLoading = state.status === 'loading';
  const isRefetching = state.status === 'success' && state.refetching === true;

  const allColumns = useMemo<ColumnDef<TData>[]>(() => {
    if (!selectable) {
      return columns;
    }
    const selectLabels = {
      selectAll: labels.selectAll,
      selectRow: labels.selectRow,
      selectNamedRow: labels.selectNamedRow,
    };
    return [createSelectColumn<TData>(selectLabels, getRowLabel), ...columns];
  }, [columns, selectable, labels.selectAll, labels.selectRow, labels.selectNamedRow, getRowLabel]);

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination
      ? (pagination.pageCount ??
        (pagination.total === undefined ? -1 : getPageCount(pagination.total, pagination.pageSize)))
      : undefined,
    enableSorting: onSortingChange !== undefined,
    enableMultiSort: false,
    sortDescFirst: false,
    enableRowSelection: selectable ? (row) => enableRowSelection?.(row.original) ?? true : false,
    onSortingChange: (updater) => {
      clearSelectionIfAny();
      onSortingChange?.(functionalUpdate(updater, sorting ?? []));
    },
    onRowSelectionChange: handleSelectionChange,
    onColumnVisibilityChange: handleVisibilityChange,
    state: { sorting: sorting ?? [], rowSelection, columnVisibility },
  });

  const rows = state.status === 'success' ? table.getRowModel().rows : NO_ROWS;
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const leafColumns = table.getVisibleLeafColumns();
  const dataColumns = leafColumns.filter((column) => column.id !== SELECT_COLUMN_ID);
  const columnCount = leafColumns.length;
  const skeletonRows = Math.min(pagination?.pageSize ?? 5, 10);
  const lastPage = pagination?.total ? getPageCount(pagination.total, pagination.pageSize) : null;

  // Deleting the last row of the last page leaves an empty page: go back one.
  useEffect(() => {
    if (
      pagination &&
      lastPage !== null &&
      state.status === 'success' &&
      data.length === 0 &&
      pagination.page > lastPage
    ) {
      pagination.onPageChange(lastPage);
    }
  }, [pagination, lastPage, state.status, data.length]);

  const first = dataColumns[0]?.id;
  const last = dataColumns[dataColumns.length - 1]?.id;
  function stickyOf(columnId: string, meta: DataTableColumnMeta) {
    return resolveSticky(columnId, meta, {
      firstColumnId: first,
      lastColumnId: last,
      stickyFirstColumn,
      stickyLastColumn,
      selectable,
    });
  }

  const emptyPanel = <DataTableEmptyPanel {...empty} labels={labelOverrides} />;
  const errorPanel =
    state.status === 'error' ? (
      <DataTableErrorPanel
        message={state.message}
        onRetry={state.onRetry}
        labels={labelOverrides}
      />
    ) : null;
  const announcement = isLoading
    ? labels.loading
    : isRefetching
      ? labels.refreshing
      : selectedRows.length > 0
        ? fillTemplate(labels.selectedAnnouncement, {
            count: formatCount(selectedRows.length),
          })
        : '';

  const showBulkBar = selectable && bulkActions !== undefined && selectedRows.length > 0;
  const cardsMode = mobile === 'cards';

  return (
    <div data-slot="data-table" className={cn('flex flex-col gap-inline', className)}>
      {toolbar || columnMenu ? (
        <div className="gap-field flex flex-wrap items-center justify-between">
          <div className="gap-field flex min-w-0 flex-1 flex-wrap items-center">{toolbar}</div>
          {columnMenu ? <DataTableColumnMenu table={table} labels={labelOverrides} /> : null}
        </div>
      ) : null}

      {showBulkBar ? (
        <DataTableBulkBar
          count={selectedRows.length}
          onClear={() => setSelection({})}
          labels={labelOverrides}
        >
          {bulkActions(selectedRows)}
        </DataTableBulkBar>
      ) : null}

      <div aria-hidden="true" className="rounded-pill h-0.5 overflow-hidden">
        {isRefetching ? (
          <div className="rounded-pill bg-primary h-full w-1/3 animate-pulse motion-reduce:animate-none" />
        ) : null}
      </div>

      <Table
        stickyHeader={stickyHeader}
        aria-busy={isLoading || isRefetching || undefined}
        containerClassName={cn(cardsMode && 'max-sm:hidden', containerClassName)}
      >
        {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => {
                const sticky = stickyOf(
                  header.column.id,
                  readColumnMeta(header.column.columnDef.meta),
                );
                return (
                  <DataTableHeaderCell
                    key={header.id}
                    header={header}
                    sticky={sticky.side}
                    className={sticky.className}
                  />
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <DataTableBody
          rows={rows}
          columnCount={columnCount}
          loading={isLoading}
          skeletonRows={skeletonRows}
          errorPanel={errorPanel}
          emptyPanel={emptyPanel}
          showEmpty={state.status === 'success' && rows.length === 0}
          onRowClick={onRowClick}
          stickyOf={stickyOf}
        />
      </Table>

      {cardsMode ? (
        <DataTableMobile
          table={table}
          rowCount={rows.length}
          loading={isLoading}
          skeletonRows={skeletonRows}
          errorPanel={errorPanel}
          emptyPanel={emptyPanel}
          renderMobileCard={renderMobileCard}
          onRowClick={onRowClick}
          getSelectLabel={
            selectable ? (row) => getSelectLabel(row, labels, getRowLabel) : undefined
          }
        />
      ) : null}

      <span role="status" className="sr-only">
        {announcement}
      </span>

      {pagination && state.status !== 'error' && pagination.total !== 0 ? (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          pageCount={pagination.pageCount}
          disabled={isLoading}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageSizeChange={
            pagination.onPageSizeChange
              ? (size) => {
                  clearSelectionIfAny();
                  pagination.onPageSizeChange?.(size);
                }
              : undefined
          }
          onPageChange={(page) => {
            clearSelectionIfAny();
            pagination.onPageChange(page);
          }}
          labels={labelOverrides?.pagination}
        />
      ) : null}
    </div>
  );
}

export { DataTable };
export type {
  DataTableEmpty,
  DataTableLabels,
  DataTablePagination,
  DataTableProps,
  DataTableState,
};
