import type { ColumnDef } from '@tanstack/react-table';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableProps } from '@/components/ui/data-table';
import { actionsColumn } from '@/components/ui/data-table-row-actions';
import { resolveVirtualize, withPinned } from '@/hooks/use-data-table-grid';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

interface Item {
  id: string;
  name: string;
  city: string;
}

function makeItems(count: number): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `i${index + 1}`,
    name: `Item ${index + 1}`,
    city: index % 2 === 0 ? 'Amman' : 'Irbid',
  }));
}

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'city', header: 'City' },
];

function setup(
  props: Partial<DataTableProps<Item>> & { count?: number; locale?: 'ar' | 'en' } = {},
) {
  const { count = 10_000, locale = 'en', ...rest } = props;
  return renderWithLocale(
    createElement(DataTable<Item>, {
      columns,
      data: makeItems(count),
      getRowId: (item) => item.id,
      state: { status: 'success' },
      caption: 'Items',
      ...rest,
    }),
    { locale },
  );
}

function container(): HTMLElement {
  const element = document.querySelector<HTMLElement>('[data-slot="table-container"]');
  if (!element) {
    throw new Error('no scroll container');
  }
  return element;
}

function dataRows(): HTMLElement[] {
  return screen
    .getAllByRole('row')
    .filter((row) => row.hasAttribute('aria-rowindex') && row.querySelector('td:not([colspan])'));
}

// jsdom has no layout: the virtualiser reads the scroll area's size from clientHeight/clientWidth.
const sizes = { height: 400 };
let clientHeight: PropertyDescriptor | undefined;
let clientWidth: PropertyDescriptor | undefined;

beforeEach(() => {
  clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
  clientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => sizes.height,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 800,
  });
});

afterEach(() => {
  for (const [name, descriptor] of [
    ['clientHeight', clientHeight],
    ['clientWidth', clientWidth],
  ] as const) {
    if (descriptor) {
      Object.defineProperty(HTMLElement.prototype, name, descriptor);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, name);
    }
  }
  sizes.height = 400;
});

describe('resolveVirtualize', () => {
  it('is off for false and undefined, and defaulted for true', () => {
    expect(resolveVirtualize(undefined)).toBeNull();
    expect(resolveVirtualize(false)).toBeNull();
    expect(resolveVirtualize(true)).toEqual({ rowHeight: 48, overscan: 8, height: 480 });
  });

  it('takes options and repairs unusable ones', () => {
    expect(resolveVirtualize({ rowHeight: 32, overscan: 2, height: '60vh' })).toEqual({
      rowHeight: 32,
      overscan: 2,
      height: '60vh',
    });
    expect(resolveVirtualize({ rowHeight: -4, overscan: -1 })).toEqual({
      rowHeight: 48,
      overscan: 0,
      height: 480,
    });
  });
});

describe('withPinned', () => {
  it('adds the pinned index in order and ignores ones already there or out of range', () => {
    expect(withPinned([2, 3, 4], 90, 100)).toEqual([2, 3, 4, 90]);
    expect(withPinned([20, 21], 3, 100)).toEqual([3, 20, 21]);
    expect(withPinned([2, 3], 3, 100)).toEqual([2, 3]);
    expect(withPinned([2, 3], -1, 100)).toEqual([2, 3]);
    expect(withPinned([2, 3], 100, 100)).toEqual([2, 3]);
  });
});

describe('DataTable virtualize', () => {
  it('renders far fewer rows than the data and describes the full list to assistive tech', () => {
    setup({ virtualize: { rowHeight: 40, overscan: 2 } });
    const rows = dataRows();
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.length).toBeLessThan(30);
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '10001');
    expect(screen.getAllByRole('columnheader')[0]?.closest('tr')).toHaveAttribute(
      'aria-rowindex',
      '1',
    );
    expect(rows[0]).toHaveAttribute('aria-rowindex', '2');
    expect(rows[1]).toHaveAttribute('aria-rowindex', '3');
    expect(screen.getByRole('cell', { name: 'Item 1' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Item 5000' })).not.toBeInTheDocument();
  });

  it('keeps the scroll height with spacer rows and a sticky header', () => {
    setup({ virtualize: { rowHeight: 40, overscan: 2, height: 400 } });
    expect(container()).toHaveStyle({ maxHeight: '400px' });
    expect(screen.getByRole('table')).toHaveAttribute('data-sticky-header');
    const spacers = document.querySelectorAll<HTMLElement>('[data-slot="data-table-spacer"]');
    expect(spacers).toHaveLength(1);
    const rendered = dataRows().length;
    expect(spacers[0]?.style.height).toBe(`${(10_000 - rendered) * 40}px`);
    expect(spacers[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the rows in view after the container scrolls, with the spacer above', () => {
    setup({ virtualize: { rowHeight: 40, overscan: 2 } });
    const scroller = container();
    act(() => {
      scroller.scrollTop = 40 * 5000;
      scroller.dispatchEvent(new Event('scroll'));
    });
    const rows = dataRows();
    expect(rows.length).toBeLessThan(30);
    expect(screen.getByRole('cell', { name: 'Item 5001' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Item 1' })).not.toBeInTheDocument();
    const first = rows[0]?.getAttribute('aria-rowindex');
    expect(Number(first)).toBeGreaterThan(4990);
    const spacers = document.querySelectorAll('[data-slot="data-table-spacer"]');
    expect(spacers).toHaveLength(2);
  });

  it('shrinks to fit a short list and shows every row', () => {
    sizes.height = 200;
    setup({ count: 3, virtualize: { rowHeight: 40, overscan: 2 } });
    expect(dataRows()).toHaveLength(3);
    expect(document.querySelector('[data-slot="data-table-spacer"]')).toBeNull();
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '4');
  });

  it('works with selection and sticky columns', async () => {
    const onRowSelectionChange = vi.fn();
    setup({
      virtualize: { rowHeight: 40 },
      selectable: true,
      stickyFirstColumn: true,
      onRowSelectionChange,
    });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 2' }));
    expect(onRowSelectionChange).toHaveBeenCalledWith({ i2: true });
    expect(screen.getByRole('cell', { name: 'Item 2' })).toHaveClass('sticky');
  });

  it('does not touch tables that are not virtualised', () => {
    setup({ count: 5 });
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-rowcount');
    expect(document.querySelector('[data-slot="data-table-spacer"]')).toBeNull();
    expect(screen.getAllByRole('row')[1]).not.toHaveAttribute('aria-rowindex');
  });

  it('is in Arabic and right-to-left without changes to the window', () => {
    setup({ virtualize: { rowHeight: 40, overscan: 2 }, locale: 'ar' });
    expect(document.documentElement.dir).toBe('rtl');
    expect(dataRows().length).toBeLessThan(30);
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '10001');
  });

  it('has no axe violations', async () => {
    const { container: root } = setup({ virtualize: { rowHeight: 40 } });
    await expectNoA11yViolations(root);
  });
});

function cellAt(row: number, column: number): HTMLElement {
  const cell = document.querySelector<HTMLElement>(
    `[data-grid-row="${row}"][data-grid-col="${column}"]`,
  );
  if (!cell) {
    throw new Error(`no cell ${row},${column}`);
  }
  return cell;
}

function focusCell(row: number, column: number) {
  act(() => cellAt(row, column).focus());
}

function focusedPosition(): string {
  const active = document.activeElement;
  return active instanceof HTMLElement && active.dataset.gridRow !== undefined
    ? `${active.dataset.gridRow},${active.dataset.gridCol}`
    : 'none';
}

describe('DataTable keyboardNavigation', () => {
  it('is a grid with one tab stop on the first cell', () => {
    setup({ count: 5, keyboardNavigation: true });
    expect(screen.getByRole('grid', { name: 'Items' })).toBeInTheDocument();
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(10);
    expect(cells.filter((cell) => cell.tabIndex === 0)).toEqual([cellAt(0, 0)]);
    expect(container()).not.toHaveAttribute('tabindex');
  });

  it('leaves the table as it was without the option', () => {
    setup({ count: 5 });
    expect(screen.getByRole('table')).not.toHaveAttribute('role', 'grid');
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0);
    expect(container()).toHaveAttribute('tabindex', '0');
  });

  it('moves with the arrow keys and does not wrap', async () => {
    const user = userEvent.setup();
    setup({ count: 5, keyboardNavigation: true });
    focusCell(0, 0);
    await user.keyboard('{ArrowDown}');
    expect(focusedPosition()).toBe('1,0');
    await user.keyboard('{ArrowRight}');
    expect(focusedPosition()).toBe('1,1');
    await user.keyboard('{ArrowRight}');
    expect(focusedPosition()).toBe('1,1');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(focusedPosition()).toBe('0,1');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(focusedPosition()).toBe('0,0');
    expect(cellAt(0, 0)).toHaveAttribute('tabindex', '0');
    expect(cellAt(1, 1)).toHaveAttribute('tabindex', '-1');
  });

  it('maps ArrowLeft to the next cell and ArrowRight to the previous one in Arabic', async () => {
    const user = userEvent.setup();
    setup({ count: 5, keyboardNavigation: true, locale: 'ar' });
    focusCell(2, 0);
    await user.keyboard('{ArrowLeft}');
    expect(focusedPosition()).toBe('2,1');
    await user.keyboard('{ArrowRight}');
    expect(focusedPosition()).toBe('2,0');
    await user.keyboard('{ArrowRight}');
    expect(focusedPosition()).toBe('2,0');
  });

  it('follows the dir attribute around the table over the locale', async () => {
    const user = userEvent.setup();
    const tableWith = (dir: 'rtl' | 'ltr') =>
      createElement(
        'div',
        { dir },
        createElement(DataTable<Item>, {
          columns,
          data: makeItems(3),
          getRowId: (item) => item.id,
          state: { status: 'success' },
          caption: 'Items',
          keyboardNavigation: true,
        }),
      );
    const english = renderWithLocale(tableWith('rtl'), { locale: 'en' });
    focusCell(0, 0);
    await user.keyboard('{ArrowLeft}');
    expect(focusedPosition()).toBe('0,1');
    english.unmount();
    renderWithLocale(tableWith('ltr'), { locale: 'ar' });
    focusCell(0, 0);
    await user.keyboard('{ArrowLeft}');
    expect(focusedPosition()).toBe('0,0');
    await user.keyboard('{ArrowRight}');
    expect(focusedPosition()).toBe('0,1');
  });

  it('supports Home, End, Ctrl+Home, Ctrl+End, PageDown and PageUp', async () => {
    const user = userEvent.setup();
    setup({ count: 40, keyboardNavigation: true });
    focusCell(3, 1);
    await user.keyboard('{Home}');
    expect(focusedPosition()).toBe('3,0');
    await user.keyboard('{End}');
    expect(focusedPosition()).toBe('3,1');
    await user.keyboard('{PageDown}');
    // With no layout to measure, a page is ten rows.
    expect(focusedPosition()).toBe('13,1');
    await user.keyboard('{PageUp}');
    expect(focusedPosition()).toBe('3,1');
    await user.keyboard('{Control>}{End}{/Control}');
    expect(focusedPosition()).toBe('39,1');
    await user.keyboard('{Control>}{Home}{/Control}');
    expect(focusedPosition()).toBe('0,0');
  });

  it('enters a cell control with Enter or F2 and returns to the cell with Escape', async () => {
    const user = userEvent.setup();
    const withButton: ColumnDef<Item>[] = [
      ...columns,
      {
        id: 'open',
        header: 'Open',
        cell: ({ row }) => createElement('button', { type: 'button' }, `Open ${row.original.name}`),
      },
    ];
    setup({ count: 3, columns: withButton, keyboardNavigation: true });
    const button = screen.getByRole('button', { name: 'Open Item 1' });
    expect(button).toHaveAttribute('tabindex', '-1');
    focusCell(0, 2);
    await user.keyboard('{Enter}');
    expect(button).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(cellAt(0, 2)).toHaveFocus();
    await user.keyboard('{F2}');
    expect(button).toHaveFocus();
    // Arrow keys belong to the control while it has focus.
    await user.keyboard('{ArrowDown}');
    expect(button).toHaveFocus();
  });

  it('opens the row on Enter when the cell has nothing to enter', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    setup({ count: 3, keyboardNavigation: true, onRowClick });
    focusCell(1, 0);
    await user.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'i2' }));
    expect(screen.getAllByRole('row')[2]).not.toHaveAttribute('tabindex');
  });

  it('follows a click to the cell that was clicked', async () => {
    const user = userEvent.setup();
    setup({ count: 5, keyboardNavigation: true });
    await user.click(cellAt(3, 1));
    expect(cellAt(3, 1)).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowUp}');
    expect(focusedPosition()).toBe('2,1');
  });

  it('ignores keys pressed inside a menu that belongs to a cell', async () => {
    const user = userEvent.setup();
    const withActions: ColumnDef<Item>[] = [
      ...columns,
      actionsColumn<Item>(() => [{ id: 'edit', label: 'Edit', onSelect: () => {} }], {
        getLabel: (item) => `Actions for ${item.name}`,
      }),
    ];
    setup({ count: 3, columns: withActions, keyboardNavigation: true });
    focusCell(0, 2);
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    expect(cellAt(0, 2)).toHaveAttribute('tabindex', '0');
  });

  it('has no axe violations', async () => {
    const { container: root } = setup({ count: 5, keyboardNavigation: true, selectable: true });
    await expectNoA11yViolations(root);
  });

  it('has no axe violations in Arabic', async () => {
    const { container: root } = setup({ count: 5, keyboardNavigation: true, locale: 'ar' });
    await expectNoA11yViolations(root);
  });
});

describe('DataTable keyboardNavigation with virtualize', () => {
  let scrollTo: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    // Browsers report scrolling asynchronously; a synchronous event would re-render inside the key handler.
    scrollTo = vi.fn(function (this: HTMLElement, options?: ScrollToOptions | number) {
      const top = typeof options === 'object' ? (options.top ?? 0) : 0;
      this.scrollTop = top;
      queueMicrotask(() => this.dispatchEvent(new Event('scroll')));
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    // The virtualiser never scrolls past the element's own scroll extent: 10,000 rows of 40px plus the header.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 10_000 * 40 + 44,
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  });

  it('scrolls the target row into view and focuses it, keeping the focused row mounted', async () => {
    const user = userEvent.setup();
    setup({ virtualize: { rowHeight: 40, overscan: 2 }, keyboardNavigation: true });
    focusCell(0, 0);
    await user.keyboard('{Control>}{End}{/Control}');
    expect(scrollTo).toHaveBeenCalled();
    expect(focusedPosition()).toBe('9999,1');
    expect(cellAt(9999, 1).closest('tr')).toHaveAttribute('aria-rowindex', '10001');
    await waitFor(() => expect(dataRows().length).toBeLessThan(30));
    await waitFor(() => expect(document.querySelector('[data-grid-row="9990"]')).not.toBeNull());
    expect(document.querySelector('[data-grid-row="3"]')).toBeNull();
    expect(cellAt(9999, 1)).toHaveFocus();

    await user.keyboard('{Control>}{Home}{/Control}');
    expect(focusedPosition()).toBe('0,0');
    expect(screen.getByRole('gridcell', { name: 'Item 1' })).toHaveFocus();
  });

  it('pages by the number of rows in view', async () => {
    const user = userEvent.setup();
    setup({ virtualize: { rowHeight: 40, overscan: 2 }, keyboardNavigation: true });
    focusCell(0, 0);
    await user.keyboard('{PageDown}');
    // (400px area - 44px header) / 40px = 8 rows
    expect(focusedPosition()).toBe('8,0');
  });

  it('keeps the focused row mounted when the list is scrolled away with the mouse', () => {
    setup({ virtualize: { rowHeight: 40, overscan: 2 }, keyboardNavigation: true });
    focusCell(0, 0);
    const scroller = container();
    act(() => {
      scroller.scrollTop = 40 * 6000;
      scroller.dispatchEvent(new Event('scroll'));
    });
    expect(cellAt(0, 0)).toHaveFocus();
    expect(screen.getByRole('gridcell', { name: 'Item 6001' })).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="data-table-spacer"]').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('works right to left', async () => {
    const user = userEvent.setup();
    setup({ virtualize: { rowHeight: 40 }, keyboardNavigation: true, locale: 'ar' });
    focusCell(0, 0);
    await user.keyboard('{ArrowLeft}');
    expect(focusedPosition()).toBe('0,1');
    await user.keyboard('{ArrowDown}');
    expect(focusedPosition()).toBe('1,1');
  });

  it('has no axe violations', async () => {
    const { container: root } = setup({ virtualize: { rowHeight: 40 }, keyboardNavigation: true });
    await expectNoA11yViolations(root);
  });
});
