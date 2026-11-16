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
import type { DataTableGroupLabels } from '@/components/ui/data-table-group-row';
import { DataTableHeaderRows } from '@/components/ui/data-table-header';
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
  DataTableExportButton,
  type DataTableToolbarLabels,
} from '@/components/ui/data-table-toolbar';
import { Pagination, type PaginationLabels } from '@/components/ui/pagination';
import { Table, TableCaption } from '@/components/ui/table';
import { useDataTableDisplay } from '@/hooks/use-data-table-display';
import type { DataTableVirtualize } from '@/hooks/use-data-table-grid';
import { useDataTableState } from '@/hooks/use-data-table-state';
import type { DataTableColumnMeta } from '@/lib/data-table-meta';
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
  DataTableGroupLabels &
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
  /**
   * Renders only the rows in view (fixed row height), for thousands of rows on one page.
   * `true` uses 48px rows in a scroll area of up to 480px; pass options to change that.
   * The header stays sticky and `aria-rowcount`/`aria-rowindex` describe the full list.
   */
  virtualize?: DataTableVirtualize;
  /**
   * Grid keyboard model (WAI-ARIA grid): one tab stop, arrow keys move between cells following
   * the reading direction, Home/End, Ctrl+Home/End, PageUp/PageDown, Enter or F2 to enter a
   * cell's controls and Escape to leave them. The table gets `role="grid"`.
   */
  keyboardNavigation?: boolean;
  /** Id of a column to group the rows of the current page by, under collapsible header rows. */
  groupBy?: string;
  /** Text for a group's name; defaults to the value as a string. */
  renderGroupLabel?: (value: unknown, rows: TData[]) => ReactNode;
  /** Totals shown at the end of each group header. */
  groupAggregates?: (group: { key: string; value: unknown; rows: TData[] }) => ReactNode;
  /** Adds an "Export" button that downloads the shown rows as an Excel-safe CSV. */
  exportable?: boolean;
  /** CSV file name without the extension. Defaults to the caption. */
  exportFilename?: string;
  /** Replaces the CSV download with your own export, for example one that asks the server for every row. */
  onExport?: (rows: TData[]) => void;
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
  virtualize,
  keyboardNavigation = false,
  groupBy,
  renderGroupLabel,
  groupAggregates,
  exportable = false,
  exportFilename,
  onExport,
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
  const { grid, display } = useDataTableDisplay({
    rows,
    columnCount,
    headerRowCount: table.getHeaderGroups().length,
    groupBy,
    virtualize,
    keyboardNavigation,
    onRowClick,
    renderGroupLabel,
    groupAggregates,
    groupLabels: labelOverrides,
  });
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
      {toolbar || columnMenu || exportable ? (
        <div className="gap-field flex flex-wrap items-center justify-between">
          <div className="gap-field flex min-w-0 flex-1 flex-wrap items-center">{toolbar}</div>
          <div className="gap-field flex items-center">
            {exportable ? (
              <DataTableExportButton
                table={table}
                rows={rows}
                filename={exportFilename ?? caption ?? 'export'}
                onExport={onExport}
                disabled={isLoading}
                labels={labelOverrides}
              />
            ) : null}
            {columnMenu ? <DataTableColumnMenu table={table} labels={labelOverrides} /> : null}
          </div>
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
        {...grid.tableProps}
        stickyHeader={stickyHeader || grid.virtual !== null}
        aria-busy={isLoading || isRefetching || undefined}
        containerRef={grid.scrollRef}
        containerStyle={grid.containerStyle}
        containerFocusable={!keyboardNavigation}
        containerClassName={cn(cardsMode && 'max-sm:hidden', containerClassName)}
      >
        {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
        <DataTableHeaderRows
          table={table}
          stickyOf={stickyOf}
          rowIndexProps={(index) => grid.rowIndexProps(index, true)}
        />
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
          display={display}
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
