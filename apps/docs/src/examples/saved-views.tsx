import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { SavedViews } from '@/components/ui/saved-views';
import { getSearch, type FilterDefinition, type FilterValues } from '@/lib/filter-state';
import type { SavedView, SavedViewSnapshot } from '@/lib/saved-views';
import type { Example } from '../example-types';

interface Order {
  id: string;
  reference: string;
  customer: string;
  status: 'open' | 'paid' | 'cancelled';
  city: string;
  total: number;
}

const customers = ['Al Noor Travel', 'شركة الأفق للسياحة', 'Desert Rose Tours', 'مكتب الواحة'];
const cities = ['Amman', 'عمّان', 'Aqaba', 'Irbid'];
const statuses = ['open', 'paid', 'cancelled'] as const;
const orders: Order[] = Array.from({ length: 64 }, (_, index) => ({
  id: `o${index + 1}`,
  reference: `OR-${String(3000 + index)}`,
  customer: customers[index % customers.length] ?? '',
  status: statuses[index % statuses.length] ?? 'open',
  city: cities[(index * 3) % cities.length] ?? '',
  total: 100 + ((index * 211) % 1900),
}));

const tone = { open: 'yellow', paid: 'green', cancelled: 'red' } as const;

const columns: ColumnDef<Order>[] = [
  { accessorKey: 'reference', header: 'Reference', meta: { cardRole: 'title' } },
  {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => <span dir="auto">{row.original.customer}</span>,
  },
  {
    accessorKey: 'city',
    header: 'City',
    cell: ({ row }) => <span dir="auto">{row.original.city}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge tone={tone[row.original.status]}>{row.original.status}</Badge>,
  },
  { accessorKey: 'total', header: 'Total', meta: { numeric: true } },
];

const filterDefinitions: FilterDefinition[] = [
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    options: statuses.map((status) => ({ value: status, label: status })),
  },
];

function matches(order: Order, filters: FilterValues): boolean {
  const query = getSearch(filters).trim().toLowerCase();
  const status = filters.status;
  return (
    (typeof status !== 'string' || status === '' || order.status === status) &&
    (query === '' ||
      `${order.reference} ${order.customer} ${order.city}`.toLowerCase().includes(query))
  );
}

function sortValue(order: Order, key: string): string | number {
  switch (key) {
    case 'total':
      return order.total;
    case 'customer':
      return order.customer;
    case 'city':
      return order.city;
    case 'status':
      return order.status;
    default:
      return order.reference;
  }
}

function sortOrders(rows: Order[], sorting: SortingState): Order[] {
  const sort = sorting[0];
  if (!sort) {
    return rows;
  }
  return [...rows].sort((a, b) => {
    const left = sortValue(a, sort.id);
    const right = sortValue(b, sort.id);
    const order = left < right ? -1 : left > right ? 1 : 0;
    return sort.desc ? -order : order;
  });
}

/**
 * A list page wired the way a real one is: the filter bar, sorting, column
 * visibility and page size are plain state, `current` is a snapshot of them,
 * and applying a view just sets that state again.
 */
function SavedViewsDemo({ storageKey }: { storageKey?: string }) {
  const [filters, setFilters] = useState<FilterValues>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pageSize, setPageSize] = useState(8);
  const [page, setPage] = useState(1);

  const current: SavedViewSnapshot = { filters, sorting, columnVisibility, pageSize };
  const filtered = useMemo(
    () =>
      sortOrders(
        orders.filter((order) => matches(order, filters)),
        sorting,
      ),
    [filters, sorting],
  );

  function apply(view: SavedView) {
    setFilters(view.filters);
    setSorting(view.sorting);
    setColumnVisibility(view.columnVisibility);
    setPageSize(view.pageSize);
    setPage(1);
  }

  return (
    <div className="gap-row flex flex-col">
      <FilterBar
        filters={filterDefinitions}
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        searchPlaceholder="Search orders"
        actions={
          <SavedViews
            current={current}
            onApplyView={apply}
            storageKey={storageKey ?? 'sas-ui-docs:saved-views'}
          />
        }
      />
      <DataTable
        caption="Orders"
        columns={columns}
        data={filtered.slice((page - 1) * pageSize, page * pageSize)}
        getRowId={(order) => order.id}
        state={{ status: 'success' }}
        columnMenu
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        sorting={sorting}
        onSortingChange={(next) => {
          setSorting(next);
          setPage(1);
        }}
        empty={{ title: 'No orders match', description: 'Clear a filter or pick another view.' }}
        pagination={{
          page,
          pageSize,
          total: filtered.length,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
          pageSizeOptions: [4, 8, 16],
        }}
      />
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'With a filter bar and a data table',
    description:
      'Set a filter, hide a column or sort, then "Save current view…". Apply it later from the menu, rename it, make it the default (applied when the page loads) or delete it. Stored in localStorage here; pass views and the on… callbacks to keep them on your server instead.',
    wide: true,
    render: () => <SavedViewsDemo />,
  },
];

export { SavedViewsDemo };
