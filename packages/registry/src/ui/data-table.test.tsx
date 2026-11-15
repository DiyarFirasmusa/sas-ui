import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableProps } from '@/components/ui/data-table';
import { actionsColumn } from '@/components/ui/data-table-row-actions';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

interface Person {
  id: string;
  name: string;
  city: string;
  age: number;
}

const people: Person[] = [
  { id: 'p1', name: 'Ali', city: 'Amman', age: 31 },
  { id: 'p2', name: 'Sara', city: 'Irbid', age: 28 },
  { id: 'p3', name: 'Omar', city: 'Zarqa', age: 45 },
];

const onEdit = vi.fn();

const columns: ColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name', meta: { cardRole: 'title' } },
  { accessorKey: 'city', header: 'City', enableSorting: false },
  { accessorKey: 'age', header: 'Age', meta: { numeric: true } },
  actionsColumn<Person>(
    (person) => [
      { id: 'edit', label: `Edit ${person.name}`, onSelect: onEdit },
      { id: 'delete', label: 'Delete', destructive: true, onSelect: () => {} },
    ],
    { getLabel: (person) => `Actions for ${person.name}` },
  ),
];

function setup(props: Partial<DataTableProps<Person>> = {}) {
  return render(
    <DataTable
      columns={columns}
      data={people}
      getRowId={(person) => person.id}
      state={{ status: 'success' }}
      caption="People"
      {...props}
    />,
  );
}

function bodyRows() {
  return screen.getAllByRole('row').slice(1);
}

function cardList(): HTMLElement {
  const list = document.querySelector<HTMLElement>('[data-slot="data-table-cards"]');
  if (!list) {
    throw new Error('no card list');
  }
  return list;
}

describe('DataTable rendering', () => {
  it('renders a captioned semantic table with column headers and rows', () => {
    setup();
    const table = screen.getByRole('table', { name: 'People' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4);
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'scope',
      'col',
    );
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByRole('cell', { name: 'Amman' })).toBeInTheDocument();
  });

  it('end-aligns numeric columns', () => {
    setup();
    expect(screen.getByRole('cell', { name: '31' })).toHaveClass('text-end', 'tabular-nums');
    expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveClass('text-end');
  });

  it('keeps the header in every state', () => {
    const { rerender } = setup({ state: { status: 'loading' } });
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    rerender(
      <DataTable columns={columns} data={[]} getRowId={(p) => p.id} state={{ status: 'error' }} />,
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });
});

describe('DataTable states', () => {
  it('shows skeleton rows while loading, as many as the page size', () => {
    const { container } = setup({
      state: { status: 'loading' },
      data: [],
      pagination: { page: 1, pageSize: 4, total: 40, onPageChange: () => {} },
    });
    expect(container.querySelectorAll('[data-slot="data-table-skeleton-row"]')).toHaveLength(4);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading')).toHaveAttribute('role', 'status');
    expect(screen.queryByRole('cell', { name: 'Ali' })).not.toBeInTheDocument();
  });

  it('shows an error row with retry', async () => {
    const onRetry = vi.fn();
    setup({
      state: { status: 'error', message: 'Server down', onRetry },
      data: [],
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load the data');
    expect(alert).toHaveTextContent('Server down');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty state with custom text and an action', () => {
    setup({
      data: [],
      empty: {
        title: 'No people yet',
        description: 'Invite someone',
        action: <button type="button">Invite</button>,
      },
    });
    expect(screen.getByText('No people yet')).toBeInTheDocument();
    expect(screen.getByText('Invite someone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
  });

  it('has a default empty message', () => {
    setup({ data: [] });
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('keeps the old rows and announces an update while refetching', () => {
    setup({ state: { status: 'success', refetching: true } });
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Updating');
  });
});

describe('DataTable sorting', () => {
  it('has no sort buttons without onSortingChange', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
  });

  it('makes sortable headers buttons with aria-sort, and skips columns that cannot sort', () => {
    setup({ onSortingChange: () => {}, sorting: [{ id: 'age', desc: true }] });
    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'City' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: 'City' })).not.toHaveAttribute('aria-sort');
  });

  it('cycles ascending, descending, none through onSortingChange', async () => {
    const seen: SortingState[] = [];
    function Controlled() {
      const [sorting, setSorting] = useState<SortingState>([]);
      return (
        <DataTable
          columns={columns}
          data={people}
          getRowId={(person) => person.id}
          state={{ status: 'success' }}
          sorting={sorting}
          onSortingChange={(next) => {
            seen.push(next);
            setSorting(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Age' }));
    expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Age' }));
    expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Age' }));
    expect(seen).toEqual([[{ id: 'age', desc: false }], [{ id: 'age', desc: true }], []]);
  });

  it('sorts a single column at a time and never reorders the rows itself', async () => {
    const onSortingChange = vi.fn();
    setup({ onSortingChange, sorting: [{ id: 'name', desc: false }] });
    await userEvent.click(screen.getByRole('button', { name: 'Age' }));
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'age', desc: false }]);
    expect(bodyRows().map((row) => within(row).getAllByRole('cell')[0]?.textContent)).toEqual([
      'Ali',
      'Sara',
      'Omar',
    ]);
  });

  it('sorts from the keyboard', async () => {
    const onSortingChange = vi.fn();
    setup({ onSortingChange });
    screen.getByRole('button', { name: 'Name' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
  });
});

describe('DataTable selection', () => {
  it('adds a labelled checkbox per row and a tri-state header checkbox', async () => {
    setup({ selectable: true });
    const all = screen.getByRole('checkbox', {
      name: 'Select all rows on this page',
    });
    expect(all).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 2' }));
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(all);
    expect(all).toBeChecked();
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(4);
    await userEvent.click(all);
    expect(screen.queryAllByRole('checkbox', { checked: true })).toHaveLength(0);
  });

  it('names row checkboxes from getRowLabel', () => {
    setup({ selectable: true, getRowLabel: (person) => person.name });
    expect(screen.getByRole('checkbox', { name: 'Select Sara' })).toBeInTheDocument();
  });

  it('marks selected rows', async () => {
    setup({ selectable: true });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    expect(bodyRows()[0]).toHaveAttribute('data-state', 'selected');
    expect(bodyRows()[1]).not.toHaveAttribute('data-state');
  });

  it('shows the bulk bar with the selected rows, announces the count and clears', async () => {
    const bulkActions = vi.fn((rows: Person[]) => (
      <button type="button">Delete {rows.length}</button>
    ));
    setup({ selectable: true, bulkActions });
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 3' }));
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(within(bar).getByText('2 selected on this page')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Delete 2' })).toBeInTheDocument();
    expect(bulkActions).toHaveBeenLastCalledWith([people[0], people[2]]);
    expect(screen.getByRole('status')).toHaveTextContent('2 rows selected');
    await userEvent.click(within(bar).getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox', { checked: true })).toHaveLength(0);
  });

  it('reports selection changes and accepts a controlled selection', async () => {
    const onRowSelectionChange = vi.fn();
    setup({
      selectable: true,
      rowSelection: { p2: true },
      onRowSelectionChange,
    });
    expect(screen.getByRole('checkbox', { name: 'Select row 2' })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    expect(onRowSelectionChange).toHaveBeenCalledWith({ p2: true, p1: true });
  });

  it('skips rows that cannot be selected', async () => {
    setup({
      selectable: true,
      enableRowSelection: (person) => person.id !== 'p2',
    });
    expect(screen.getByRole('checkbox', { name: 'Select row 2' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows on this page' }));
    expect(screen.getByRole('checkbox', { name: 'Select row 2' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeChecked();
  });

  it('clears the selection when the page changes', async () => {
    const onPageChange = vi.fn();
    setup({
      selectable: true,
      bulkActions: () => null,
      pagination: { page: 1, pageSize: 3, total: 9, onPageChange },
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('clears the selection when the sort changes', async () => {
    setup({
      selectable: true,
      bulkActions: () => null,
      onSortingChange: () => {},
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });
});

describe('DataTable columns', () => {
  it('hides and shows columns from the column menu, never listing the actions column', async () => {
    const onColumnVisibilityChange = vi.fn();
    setup({ columnMenu: true, onColumnVisibilityChange });
    await userEvent.click(screen.getByRole('button', { name: /Columns/ }));
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Actions' })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'City' }));
    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ city: false });
    expect(screen.queryByRole('columnheader', { name: 'City' })).not.toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Amman' })).not.toBeInTheDocument();
  });

  it('starts with the given visibility', () => {
    setup({ columnVisibility: { age: false } });
    expect(screen.queryByRole('columnheader', { name: 'Age' })).not.toBeInTheDocument();
  });

  it('pins the first and last columns with logical sticky classes', () => {
    setup({ stickyFirstColumn: true, stickyLastColumn: true });
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('sticky', 'start-0');
    expect(screen.getByRole('cell', { name: 'Ali' })).toHaveClass('sticky', 'start-0');
    expect(bodyRows()[0]?.lastElementChild).toHaveClass('sticky', 'end-0');
  });

  it('offsets the first data column past a sticky selection column', () => {
    setup({ stickyFirstColumn: true, selectable: true });
    expect(screen.getByRole('cell', { name: 'Ali' })).toHaveClass('start-12');
    expect(
      screen.getByRole('columnheader', {
        name: 'Select all rows on this page',
      }),
    ).toHaveClass('sticky', 'start-0');
  });

  it('supports a sticky header', () => {
    setup({ stickyHeader: true, containerClassName: 'max-h-96' });
    expect(screen.getByRole('table')).toHaveAttribute('data-sticky-header');
    expect(screen.getByRole('table').parentElement).toHaveClass('max-h-96');
  });
});

describe('DataTable row actions and clicks', () => {
  it('opens a per-row menu without triggering the row click', async () => {
    const onRowClick = vi.fn();
    setup({ onRowClick });
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Sara' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit Sara' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('calls onRowClick for a click on a cell and for Enter on the focused row', async () => {
    const onRowClick = vi.fn();
    setup({ onRowClick });
    await userEvent.click(screen.getByRole('cell', { name: 'Irbid' }));
    expect(onRowClick).toHaveBeenLastCalledWith(people[1]);
    bodyRows()[2]?.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenLastCalledWith(people[2]);
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it('does not run the row click when a row checkbox is used', async () => {
    const onRowClick = vi.fn();
    setup({ onRowClick, selectable: true });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('makes rows focusable only when they are clickable', () => {
    const { unmount } = setup();
    expect(bodyRows()[0]).not.toHaveAttribute('tabindex');
    unmount();
    setup({ onRowClick: () => {} });
    expect(bodyRows()[0]).toHaveAttribute('tabindex', '0');
  });
});

describe('DataTable pagination', () => {
  it('renders the pagination glue and reports page and size changes', async () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    setup({
      pagination: {
        page: 2,
        pageSize: 3,
        total: 10,
        onPageChange,
        onPageSizeChange,
        pageSizeOptions: [3, 6],
      },
    });
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByText('Showing 4–6 of 10')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
    await userEvent.click(screen.getByRole('combobox', { name: 'Rows per page' }));
    await userEvent.click(await screen.findByRole('option', { name: '6' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(6);
  });

  it('locks the pagination while loading and hides it for an empty total or an error', () => {
    const pagination = {
      page: 1,
      pageSize: 3,
      total: 10,
      onPageChange: () => {},
    };
    const { rerender } = setup({ state: { status: 'loading' }, pagination });
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        state={{ status: 'error' }}
        pagination={pagination}
      />,
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        state={{ status: 'success' }}
        pagination={{ ...pagination, total: 0 }}
      />,
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('goes back to the last page when the current page ran out of rows', async () => {
    const onPageChange = vi.fn();
    setup({
      data: [],
      pagination: { page: 4, pageSize: 3, total: 7, onPageChange },
    });
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(3));
  });

  it('does not jump when page 1 is simply empty', () => {
    const onPageChange = vi.fn();
    setup({
      data: [],
      pagination: { page: 1, pageSize: 3, total: 0, onPageChange },
    });
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

describe('DataTable mobile cards', () => {
  it('renders cards with a title, labelled fields and the actions, and hides the table below sm', () => {
    setup({ mobile: 'cards' });
    expect(screen.getByRole('table').parentElement).toHaveClass('max-sm:hidden');
    expect(cardList()).toHaveClass('sm:hidden');
    const first = within(cardList()).getAllByRole('listitem')[0];
    if (!first) {
      throw new Error('no card');
    }
    expect(within(first).getByText('Ali')).toBeInTheDocument();
    expect(within(first).getByText('City')).toBeInTheDocument();
    expect(within(first).getByText('Amman')).toBeInTheDocument();
    expect(within(first).getByText('Age')).toBeInTheDocument();
    expect(within(first).getByRole('button', { name: 'Actions for Ali' })).toBeInTheDocument();
  });

  it('uses a custom card renderer with selection control', async () => {
    const onRowSelectionChange = vi.fn();
    setup({
      mobile: 'cards',
      selectable: true,
      onRowSelectionChange,
      renderMobileCard: (person, { selectionControl }) => (
        <div>
          {selectionControl}
          <strong>{person.name} card</strong>
        </div>
      ),
    });
    expect(screen.getByText('Ali card')).toBeInTheDocument();
    const [checkbox] = within(cardList()).getAllByRole('checkbox', {
      name: 'Select row 1',
    });
    if (!checkbox) {
      throw new Error('no checkbox');
    }
    await userEvent.click(checkbox);
    expect(onRowSelectionChange).toHaveBeenCalledWith({ p1: true });
  });

  it('runs onRowClick from a card but not from its controls', async () => {
    const onRowClick = vi.fn();
    setup({ mobile: 'cards', onRowClick });
    await userEvent.click(within(cardList()).getByText('Amman'));
    expect(onRowClick).toHaveBeenCalledWith(people[0]);
    await userEvent.click(within(cardList()).getByRole('button', { name: 'Actions for Sara' }));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading, error and empty states as cards too', () => {
    const mobile = () => {
      const element = document.querySelector<HTMLElement>('[data-slot="data-table-mobile"]');
      if (!element) {
        throw new Error('no mobile layout');
      }
      return element;
    };
    const { rerender } = setup({
      mobile: 'cards',
      state: { status: 'loading' },
    });
    expect(
      document.querySelectorAll('[data-slot="data-table-skeleton-card"]').length,
    ).toBeGreaterThan(0);
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        state={{ status: 'error', onRetry: () => {} }}
        mobile="cards"
      />,
    );
    expect(within(mobile()).getByRole('alert')).toBeInTheDocument();
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        state={{ status: 'success' }}
        mobile="cards"
      />,
    );
    expect(within(mobile()).getByText('No results')).toBeInTheDocument();
  });

  it('renders no cards in the default layout', () => {
    setup();
    expect(document.querySelector('[data-slot="data-table-cards"]')).toBeNull();
  });
});

describe('DataTable locale and accessibility', () => {
  it('localises its own labels to Arabic', async () => {
    renderWithLocale(
      <DataTable
        columns={columns}
        data={people}
        getRowId={(person) => person.id}
        state={{ status: 'success' }}
        selectable
        columnMenu
        bulkActions={() => null}
        pagination={{ page: 1, pageSize: 3, total: 9, onPageChange: () => {} }}
      />,
      { locale: 'ar' },
    );
    expect(
      screen.getByRole('checkbox', { name: 'تحديد كل الصفوف في هذه الصفحة' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'تحديد الصف 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /الأعمدة/ })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'ترقيم الصفحات' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'تحديد الصف 1' }));
    expect(screen.getByRole('toolbar', { name: 'إجراءات جماعية' })).toBeInTheDocument();
  });

  it('accepts label overrides', () => {
    setup({ selectable: true, labels: { selectAll: 'Pick all' } });
    expect(screen.getByRole('checkbox', { name: 'Pick all' })).toBeInTheDocument();
  });

  it('has no axe violations when loaded with every feature on', async () => {
    const { container } = setup({
      selectable: true,
      columnMenu: true,
      onSortingChange: () => {},
      sorting: [{ id: 'name', desc: false }],
      stickyHeader: true,
      stickyFirstColumn: true,
      mobile: 'cards',
      onRowClick: () => {},
      bulkActions: () => <button type="button">Archive</button>,
      pagination: {
        page: 1,
        pageSize: 3,
        total: 9,
        onPageChange: () => {},
        onPageSizeChange: () => {},
      },
      toolbar: <input aria-label="Filter" />,
    });
    await userEvent.click(
      screen.getAllByRole('checkbox', {
        name: 'Select row 1',
      })[0] as HTMLElement,
    );
    await expectNoA11yViolations(container);
  });

  it('has no axe violations while loading, in error and when empty', async () => {
    const { container, rerender } = setup({ state: { status: 'loading' } });
    await expectNoA11yViolations(container);
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        state={{ status: 'error', onRetry: () => {} }}
      />,
    );
    await expectNoA11yViolations(container);
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(p) => p.id}
        state={{ status: 'success' }}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
