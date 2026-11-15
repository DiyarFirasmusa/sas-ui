import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableState } from '@/components/ui/data-table';
import { actionsColumn } from '@/components/ui/data-table-row-actions';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import type { Example } from '../example-types';

interface Booking {
  id: string;
  reference: string;
  customer: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  nights: number;
  total: number;
}

const customers = [
  'Al Noor Travel',
  'شركة الأفق للسياحة',
  'Desert Rose Tours',
  'مكتب الواحة',
  'Blue Bay Agency',
];
const statuses = ['confirmed', 'pending', 'cancelled'] as const;
const allBookings: Booking[] = Array.from({ length: 47 }, (_, index) => ({
  id: `b${index + 1}`,
  reference: `BK-${String(2000 + index)}`,
  customer: customers[index % customers.length] ?? '',
  status: statuses[index % statuses.length] ?? 'pending',
  nights: (index % 6) + 1,
  total: 320 + ((index * 137) % 2400),
}));

const tone = {
  confirmed: 'green',
  pending: 'yellow',
  cancelled: 'red',
} as const;
const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 });

/** Stands in for the server: sorts, slices and answers after a short delay. */
function fetchBookings(
  page: number,
  pageSize: number,
  sorting: SortingState,
): Promise<{ rows: Booking[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sort = sorting[0];
      const sorted = sort
        ? [...allBookings].sort((a, b) => {
            const left = a[sort.id as keyof Booking];
            const right = b[sort.id as keyof Booking];
            const order = left < right ? -1 : left > right ? 1 : 0;
            return sort.desc ? -order : order;
          })
        : allBookings;
      resolve({
        rows: sorted.slice((page - 1) * pageSize, page * pageSize),
        total: allBookings.length,
      });
    }, 600);
  });
}

const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: 'reference',
    header: 'Reference',
    cell: ({ row }) => (
      <span className="font-mono" dir="ltr">
        {row.original.reference}
      </span>
    ),
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    meta: { cardRole: 'title' },
    cell: ({ row }) => <span dir="auto">{row.original.customer}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge tone={tone[row.original.status]}>{row.original.status}</Badge>,
  },
  { accessorKey: 'nights', header: 'Nights', meta: { numeric: true } },
  {
    accessorKey: 'total',
    header: 'Total',
    meta: { numeric: true },
    cell: ({ row }) => money.format(row.original.total),
  },
  actionsColumn<Booking>(
    (booking) => [
      { id: 'edit', label: 'Edit', icon: <PencilIcon />, onSelect: () => {} },
      {
        id: 'delete',
        label: 'Delete',
        icon: <TrashIcon />,
        destructive: true,
        onSelect: () => {},
      },
      {
        id: 'noop',
        label: `Duplicate ${booking.reference}`,
        onSelect: () => {},
      },
    ],
    { getLabel: (booking) => `Actions for ${booking.reference}` },
  ),
];

function ServerTable({
  mobile = 'scroll',
  sticky = false,
}: {
  mobile?: 'scroll' | 'cards';
  sticky?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rows, setRows] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    fetchBookings(page, pageSize, sorting).then((result) => {
      if (!cancelled) {
        setRows(result.rows);
        setTotal(result.total);
        setLoaded(true);
        setFetching(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, sorting, attempt]);

  // First load shows skeleton rows; later pages keep the old rows under a progress bar.
  const state: DataTableState = loaded
    ? { status: 'success', refetching: fetching }
    : { status: 'loading' };

  return (
    <DataTable
      caption="Bookings"
      columns={columns}
      data={rows}
      getRowId={(booking) => booking.id}
      state={state}
      selectable
      getRowLabel={(booking) => booking.reference}
      columnMenu
      stickyFirstColumn={sticky}
      stickyLastColumn={sticky}
      mobile={mobile}
      sorting={sorting}
      onSortingChange={(next) => {
        setSorting(next);
        setPage(1);
      }}
      pagination={{
        page,
        pageSize,
        total,
        onPageChange: setPage,
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPage(1);
        },
      }}
      bulkActions={(selected) => (
        <>
          <Button size="sm" variant="outline" onClick={() => setAttempt((count) => count + 1)}>
            Export {selected.length}
          </Button>
          <Button size="sm" variant="destructive-soft">
            Cancel {selected.length}
          </Button>
        </>
      )}
    />
  );
}

export const examples: Example[] = [
  {
    title: 'Server-driven',
    description:
      'Sorting, paging and size come from the server (simulated here). Selection is per page and clears when the page or sort changes.',
    wide: true,
    render: () => <ServerTable />,
  },
  {
    title: 'Sticky first and last columns',
    wide: true,
    render: () => (
      <div className="max-w-xl">
        <ServerTable sticky />
      </div>
    ),
  },
  {
    title: 'Mobile cards',
    description: 'Below the sm breakpoint each row becomes a card; resize the preview to see it.',
    wide: true,
    render: () => <ServerTable mobile="cards" />,
  },
  {
    title: 'Loading',
    wide: true,
    render: () => (
      <DataTable
        caption="Bookings"
        columns={columns}
        data={[]}
        getRowId={(booking) => booking.id}
        state={{ status: 'loading' }}
        pagination={{ page: 1, pageSize: 5, total: 47, onPageChange: () => {} }}
      />
    ),
  },
  {
    title: 'Error with retry',
    wide: true,
    render: () => (
      <DataTable
        caption="Bookings"
        columns={columns}
        data={[]}
        getRowId={(booking) => booking.id}
        state={{
          status: 'error',
          message: 'The server did not answer in time.',
          onRetry: () => {},
        }}
      />
    ),
  },
  {
    title: 'Empty',
    wide: true,
    render: () => (
      <DataTable
        caption="Bookings"
        columns={columns}
        data={[]}
        getRowId={(booking) => booking.id}
        state={{ status: 'success' }}
        empty={{
          title: 'No bookings match your filters',
          description: 'Try a different status or date range.',
          action: <Button variant="outline">Clear filters</Button>,
        }}
      />
    ),
  },
];
