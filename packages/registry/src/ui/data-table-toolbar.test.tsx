import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableProps } from '@/components/ui/data-table';
import {
  DataTableBulkBar,
  DataTableColumnMenu,
  DataTableExportButton,
} from '@/components/ui/data-table-toolbar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

interface Item {
  id: string;
  name: string;
  total: number;
}

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'total', header: 'Total' },
  { id: 'custom', header: () => 'Custom', meta: { label: 'Custom column' } },
  { id: 'locked', header: 'Locked', enableHiding: false },
];

function Menu({ onVisibility }: { onVisibility?: (state: VisibilityState) => void }) {
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const table = useReactTable({
    data: [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility: visibility },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(visibility) : updater;
      setVisibility(next);
      onVisibility?.(next);
    },
  });
  return (
    <>
      <DataTableColumnMenu table={table} />
      <output>
        {table
          .getVisibleLeafColumns()
          .map((column) => column.id)
          .join(',')}
      </output>
    </>
  );
}

describe('DataTableColumnMenu', () => {
  it('lists hideable columns with checkboxes and toggles them', async () => {
    const onVisibility = vi.fn();
    render(<Menu onVisibility={onVisibility} />);
    await userEvent.click(screen.getByRole('button', { name: /Columns/ }));
    const items = await screen.findAllByRole('menuitemcheckbox');
    expect(items.map((item) => item.textContent)).toEqual(['Name', 'Total', 'Custom column']);
    expect(items[0]).toBeChecked();
    await userEvent.click(items[1] as HTMLElement);
    expect(onVisibility).toHaveBeenCalledWith({ total: false });
    expect(screen.getByRole('status')).toHaveTextContent('name,custom,locked');
    expect(items[1]).not.toBeChecked();
  });

  it('is labelled in Arabic', () => {
    renderWithLocale(<Menu />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: /الأعمدة/ })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Menu />);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: /Columns/ }));
    await screen.findByRole('menu');
    await expectNoA11yViolations();
  });
});

describe('DataTableBulkBar', () => {
  it('shows the count, the actions and a clear button', async () => {
    const onClear = vi.fn();
    render(
      <DataTableBulkBar count={1234} onClear={onClear}>
        <button type="button">Archive</button>
      </DataTableBulkBar>,
    );
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(within(bar).getByText('1,234 selected on this page')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    await userEvent.click(within(bar).getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('localises to Arabic with Latin digits', () => {
    renderWithLocale(<DataTableBulkBar count={3} onClear={() => {}} />, {
      locale: 'ar',
    });
    expect(screen.getByRole('toolbar', { name: 'إجراءات جماعية' })).toBeInTheDocument();
    expect(screen.getByText('تم تحديد 3 في هذه الصفحة')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إلغاء التحديد' })).toBeInTheDocument();
  });

  it('accepts label overrides', () => {
    render(
      <DataTableBulkBar count={2} onClear={() => {}} labels={{ clearSelection: 'Deselect' }} />,
    );
    expect(screen.getByRole('button', { name: 'Deselect' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DataTableBulkBar count={2} onClear={() => {}}>
        <button type="button">Archive</button>
      </DataTableBulkBar>,
    );
    await expectNoA11yViolations(container);
  });
});

interface Trip {
  id: string;
  title: string;
  total: number;
  note: string;
  when: Date;
}

const trips: Trip[] = [
  {
    id: 't1',
    title: 'رحلة العقبة',
    total: 120.5,
    note: '=HYPERLINK("x")',
    when: new Date('2025-03-01T00:00:00Z'),
  },
  {
    id: 't2',
    title: 'Petra, "day trip"',
    total: -4,
    note: '٠٧٧٠١٢٣',
    when: new Date('2025-04-02T00:00:00Z'),
  },
];

const tripColumns: ColumnDef<Trip>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'total', header: 'Total' },
  { accessorKey: 'note', header: () => 'Note', meta: { label: 'Remark' } },
  { accessorKey: 'when', header: 'When' },
  { id: 'open', header: 'Open', cell: () => <button type="button">Open</button> },
];

function readText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function stubDownload() {
  const blobs: Blob[] = [];
  const names: string[] = [];
  const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      blobs.push(blob);
      return 'blob:export';
    },
    revokeObjectURL: () => {},
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    names.push(this.download);
  });
  return {
    blobs,
    names,
    restore: () =>
      Object.assign(URL, { createObjectURL: original.create, revokeObjectURL: original.revoke }),
  };
}

describe('data table export', () => {
  let restore: () => void = () => {};
  afterEach(() => restore());

  function table(props: Partial<DataTableProps<Trip>> = {}, locale: 'en' | 'ar' = 'en') {
    return renderWithLocale(
      <DataTable
        columns={tripColumns}
        data={trips}
        getRowId={(trip) => trip.id}
        state={{ status: 'success' }}
        caption="Trips"
        exportable
        {...props}
      />,
      { locale },
    );
  }

  it('is off unless exportable is set', () => {
    table({ exportable: false });
    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
  });

  it('downloads the shown rows as an Excel-safe CSV of the data columns', async () => {
    const stub = stubDownload();
    restore = stub.restore;
    table({ selectable: true, columnMenu: true });
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(stub.names).toEqual(['Trips.csv']);
    const text = await readText(stub.blobs[0] as Blob);
    expect(text.split('\r\n')).toEqual([
      // FileReader drops the byte order mark when decoding; the byte-level check is in table-export.test.ts.
      'Title,Total,Remark,When',
      'رحلة العقبة,120.5,"\'=HYPERLINK(""x"")",2025-03-01T00:00:00.000Z',
      '"Petra, ""day trip""",-4,0770123,2025-04-02T00:00:00.000Z',
    ]);
  });

  it('uses the file name it is given', async () => {
    const stub = stubDownload();
    restore = stub.restore;
    table({ exportFilename: 'تقرير الرحلات' });
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(stub.names).toEqual(['تقرير الرحلات.csv']);
  });

  it('leaves out hidden columns', async () => {
    const stub = stubDownload();
    restore = stub.restore;
    table({ columnVisibility: { note: false, when: false } });
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    const text = await readText(stub.blobs[0] as Blob);
    expect(text.split('\r\n')[0]).toBe('Title,Total');
  });

  it('hands the rows to onExport instead of downloading', async () => {
    const stub = stubDownload();
    restore = stub.restore;
    const onExport = vi.fn();
    table({ onExport });
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalledWith(trips);
    expect(stub.names).toEqual([]);
  });

  it('is disabled while loading and when there are no rows', () => {
    const { unmount } = table({ state: { status: 'loading' }, data: [] });
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
    unmount();
    table({ data: [] });
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('is labelled in Arabic and accepts a label override', () => {
    const { unmount } = table({}, 'ar');
    expect(screen.getByRole('button', { name: 'تصدير' })).toBeInTheDocument();
    unmount();
    table({ labels: { export: 'Download CSV' } });
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeInTheDocument();
  });

  it('works on its own with a TanStack table', async () => {
    const stub = stubDownload();
    restore = stub.restore;
    function Standalone() {
      const instance = useReactTable({
        data: trips,
        columns: tripColumns,
        getCoreRowModel: getCoreRowModel(),
      });
      return (
        <DataTableExportButton
          table={instance}
          rows={instance.getRowModel().rows}
          filename="x.csv"
        />
      );
    }
    render(<Standalone />);
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(stub.names).toEqual(['x.csv']);
  });

  it('has no axe violations', async () => {
    const { container } = table({ columnMenu: true });
    await expectNoA11yViolations(container);
  });
});
