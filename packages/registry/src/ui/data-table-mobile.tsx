import type { Row, Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { DataTableCards, type MobileCardContext } from '@/components/ui/data-table-cards';
import { DataTableSkeletonCards } from '@/components/ui/data-table-states';

interface DataTableMobileProps<TData> {
  table: Table<TData>;
  rowCount: number;
  loading: boolean;
  skeletonRows: number;
  errorPanel: ReactNode;
  emptyPanel: ReactNode;
  renderMobileCard?: (row: TData, context: MobileCardContext<TData>) => ReactNode;
  onRowClick?: (row: TData) => void;
  getSelectLabel?: (row: Row<TData>) => string;
}

/** The `mobile="cards"` layout: skeleton, error or empty panel, or the row cards. Shown below the sm breakpoint only. */
function DataTableMobile<TData>({
  table,
  rowCount,
  loading,
  skeletonRows,
  errorPanel,
  emptyPanel,
  renderMobileCard,
  onRowClick,
  getSelectLabel,
}: DataTableMobileProps<TData>) {
  return (
    <div data-slot="data-table-mobile" className="sm:hidden">
      {loading ? (
        <ul className="gap-inline flex flex-col">
          <DataTableSkeletonCards rowCount={skeletonRows} />
        </ul>
      ) : errorPanel ? (
        <div className="border-stroke bg-surface rounded-lg border">{errorPanel}</div>
      ) : rowCount === 0 ? (
        <div className="border-stroke bg-surface rounded-lg border">{emptyPanel}</div>
      ) : (
        <DataTableCards
          table={table}
          renderMobileCard={renderMobileCard}
          onRowClick={onRowClick}
          getSelectLabel={getSelectLabel}
        />
      )}
    </div>
  );
}

export { DataTableMobile };
export type { DataTableMobileProps };
