import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableState } from '@/components/ui/data-table';
import { actionsColumn } from '@/components/ui/data-table-row-actions';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import type { Example } from '../example-types';
import { SavedViewsDemo } from './saved-views';

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

/** Ten thousand rows: only the ones in view are in the page. */
const manyBookings: Booking[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: `m${index + 1}`,
  reference: `BK-${String(10_000 + index)}`,
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

function toneOf(value: unknown) {
  return value === 'confirmed' || value === 'pending' || value === 'cancelled'
    ? tone[value]
    : 'neutral';
}

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
  title,
}: {
  mobile?: 'scroll' | 'cards';
  sticky?: boolean;
  title?: string;
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
      title={title}
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
    title: 'Panel title',
    description:
      'The table sits in the dashboards’ panel by default (20px radius and padding); `title` adds a heading with the row count and `embedded` drops the panel when it is already inside a card.',
    wide: true,
    render: () => <ServerTable title="Bookings" />,
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
  {
    title: '10,000 rows, virtualised',
    description:
      'Only the rows in view are rendered (fixed 48px rows), the header stays put and the scroll bar covers all 10,000. aria-rowcount and aria-rowindex describe the full list to screen readers. Selection and sticky columns still work.',
    wide: true,
    render: () => (
      <DataTable
        caption="10,000 bookings"
        columns={columns.slice(0, 5)}
        data={manyBookings}
        getRowId={(booking) => booking.id}
        state={{ status: 'success' }}
        selectable
        getRowLabel={(booking) => booking.reference}
        stickyFirstColumn
        virtualize={{ rowHeight: 48, height: 420 }}
      />
    ),
  },
  {
    title: 'Keyboard navigation',
    description:
      'Click a cell or Tab into the grid, then use the arrow keys, Home/End, Ctrl+Home/End and PageUp/PageDown. Switch the docs to Arabic: ArrowLeft then moves to the next cell and ArrowRight to the previous one. Enter or F2 enters a cell that holds a control (the actions menu), Escape returns to the cell.',
    wide: true,
    render: () => (
      <DataTable
        caption="Bookings grid"
        columns={columns}
        data={allBookings.slice(0, 12)}
        getRowId={(booking) => booking.id}
        state={{ status: 'success' }}
        keyboardNavigation
        onRowClick={() => {}}
      />
    ),
  },
  {
    title: 'Keyboard navigation with 10,000 rows',
    description:
      'Ctrl+End jumps to the last row: the virtualiser scrolls it into view and focus follows.',
    wide: true,
    render: () => (
      <DataTable
        caption="10,000 bookings grid"
        columns={columns.slice(0, 5)}
        data={manyBookings}
        getRowId={(booking) => booking.id}
        state={{ status: 'success' }}
        keyboardNavigation
        virtualize={{ rowHeight: 48, height: 320 }}
      />
    ),
  },
  {
    title: 'Grouped rows',
    description:
      'groupBy turns each value of a column into a collapsible header row with its count (Latin digits) and optional aggregates. Enter or Space on a header toggles it. Grouping applies to the rows of the current page.',
    wide: true,
    render: () => (
      <DataTable
        caption="Bookings by status"
        columns={columns}
        data={allBookings.slice(0, 18)}
        getRowId={(booking) => booking.id}
        state={{ status: 'success' }}
        groupBy="status"
        renderGroupLabel={(value) => <Badge tone={toneOf(value)}>{String(value)}</Badge>}
        groupAggregates={({ rows }) =>
          `Total ${money.format(rows.reduce((sum, booking) => sum + booking.total, 0))}`
        }
        stickyHeader
        containerClassName="max-h-96"
      />
    ),
  },
  {
    title: 'Export to CSV',
    description:
      'exportable adds an Export button. It downloads the shown rows as a CSV that opens correctly in Excel, Arabic included (UTF-8 BOM, CRLF, formula-injection guard, Latin digits, ISO dates). Pass onExport to ask the server for every row instead.',
    wide: true,
    render: () => (
      <DataTable
        caption="Bookings"
        columns={columns}
        data={allBookings.slice(0, 8)}
        getRowId={(booking) => booking.id}
        state={{ status: 'success' }}
        exportable
        exportFilename="bookings"
        columnMenu
      />
    ),
  },
  {
    title: 'Saved views',
    description:
      'SavedViews stores a snapshot of the filter bar, sorting, column visibility and page size. Save one, change the filters, then apply it again. Views persist in localStorage; set one as the default to apply it on load.',
    wide: true,
    render: () => <SavedViewsDemo storageKey="sas-ui-docs:data-table:views" />,
  },
];
