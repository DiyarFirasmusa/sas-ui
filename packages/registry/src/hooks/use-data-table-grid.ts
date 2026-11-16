import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import {
  clampGridPosition,
  isGridNavigationKey,
  nextGridPosition,
  type GridDirection,
  type GridPosition,
} from '@/lib/data-table-navigation';
import { useLocale } from '@/lib/locale';

interface DataTableVirtualOptions {
  /** Height of every body row in px. Rows are not measured, so the content must fit in it. */
  rowHeight: number;
  /** Rows rendered beyond the visible ones on each side. Default 8. */
  overscan?: number;
  /** Largest height of the scroll area (px or any CSS length). Shorter lists shrink to fit. Default 480px. */
  height?: number | string;
}

type DataTableVirtualize = boolean | DataTableVirtualOptions;

interface ResolvedVirtual {
  rowHeight: number;
  overscan: number;
  height: number | string;
}

/** Rendered between row windows to keep the scroll height right. */
type GridEntry = { type: 'spacer'; key: string; height: number } | { type: 'row'; index: number };

interface GridCellProps {
  role?: 'gridcell';
  tabIndex?: number;
  className?: string;
  'data-grid-row'?: number;
  'data-grid-col'?: number;
}

interface UseDataTableGridOptions {
  /** Number of displayed rows (group headers included). */
  count: number;
  columnCount: number;
  /** Cells in a row; group headers span the table and have one. */
  columnsInRow?: (row: number) => number;
  /** Header rows above the body, for `aria-rowindex`. */
  headerRowCount: number;
  virtualize?: DataTableVirtualize;
  keyboardNavigation: boolean;
  /**
   * Enter or Space on a cell. `hasContent` says whether the cell holds something
   * focusable. Return true when handled (a group toggled, a row opened).
   */
  onActivate?: (row: number, hasContent: boolean) => boolean;
}

const DEFAULT_ROW_HEIGHT = 48;
const DEFAULT_OVERSCAN = 8;
const DEFAULT_HEIGHT = 480;
const DEFAULT_PAGE_SIZE = 10;
/** The sticky header (`h-11`) covers the top of the scroll area; rows scrolled to must stay clear of it. */
const HEADER_HEIGHT = 44;

const CONTENT_SELECTORS = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]',
];
const CONTENT_SELECTOR = CONTENT_SELECTORS.join(',');
const CELL_CONTENT_SELECTOR = CONTENT_SELECTORS.map(
  (selector) => `[data-grid-row] ${selector}`,
).join(',');

function resolveVirtualize(value: DataTableVirtualize | undefined): ResolvedVirtual | null {
  if (!value) {
    return null;
  }
  const options: Partial<DataTableVirtualOptions> = value === true ? {} : value;
  const rowHeight =
    options.rowHeight !== undefined && Number.isFinite(options.rowHeight) && options.rowHeight > 0
      ? options.rowHeight
      : DEFAULT_ROW_HEIGHT;
  return {
    rowHeight,
    overscan: Math.max(options.overscan ?? DEFAULT_OVERSCAN, 0),
    height: options.height ?? DEFAULT_HEIGHT,
  };
}

/** The window of indexes plus the one that must stay mounted (the focused row). */
function withPinned(indexes: number[], pinned: number, count: number): number[] {
  if (pinned < 0 || pinned >= count || indexes.includes(pinned)) {
    return indexes;
  }
  return [...indexes, pinned].sort((a, b) => a - b);
}

function focusableIn(cell: HTMLElement): HTMLElement | undefined {
  return [...cell.querySelectorAll<HTMLElement>(CONTENT_SELECTOR)].find(
    (element) => !element.matches(':disabled') && element.getAttribute('aria-disabled') !== 'true',
  );
}

/**
 * The direction the cells are laid out in: the nearest `dir` attribute, which is
 * what CSS inherits, so a `dir="rtl"` wrapper around an English table still
 * mirrors the arrow keys. Falls back to the locale's direction.
 */
function readDirection(element: Element, fallback: GridDirection): GridDirection {
  const attribute = element.closest('[dir="rtl"],[dir="ltr"]')?.getAttribute('dir');
  return attribute === 'rtl' || attribute === 'ltr' ? attribute : fallback;
}

function positionOf(cell: Element): GridPosition | null {
  if (!(cell instanceof HTMLElement)) {
    return null;
  }
  const row = Number(cell.dataset.gridRow);
  const column = Number(cell.dataset.gridCol);
  return Number.isInteger(row) && Number.isInteger(column) ? { row, column } : null;
}

/**
 * Row windowing and grid keyboard navigation for the data table. Both are
 * opt-in: with neither, it returns props that change nothing.
 *
 * Virtualisation is vertical only (rows have a fixed height). Keyboard
 * navigation follows the WAI-ARIA grid pattern with a roving tab stop on the
 * cells; the focused row is kept mounted so it never disappears while scrolling.
 */
function useDataTableGrid({
  count,
  columnCount,
  columnsInRow,
  headerRowCount,
  virtualize,
  keyboardNavigation,
  onActivate,
}: UseDataTableGridOptions) {
  const { direction } = useLocale();
  const virtual = resolveVirtualize(virtualize);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const focusPending = useRef(false);
  const [active, setActive] = useState<GridPosition>({ row: 0, column: 0 });
  const position = clampGridPosition(active, count, columnCount, columnsInRow);
  const pinnedRow = keyboardNavigation ? position.row : -1;

  const virtualizer = useVirtualizer({
    count,
    enabled: virtual !== null,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => virtual?.rowHeight ?? DEFAULT_ROW_HEIGHT,
    overscan: virtual?.overscan ?? DEFAULT_OVERSCAN,
    scrollPaddingEnd: HEADER_HEIGHT,
    initialRect: {
      width: 0,
      height: typeof virtual?.height === 'number' ? virtual.height : DEFAULT_HEIGHT,
    },
    rangeExtractor: (range) => withPinned(defaultRangeExtractor(range), pinnedRow, count),
  });

  let entries: GridEntry[] | null = null;
  if (virtual) {
    entries = [];
    let cursor = 0;
    for (const item of virtualizer.getVirtualItems()) {
      if (item.start > cursor) {
        entries.push({ type: 'spacer', key: `spacer-${cursor}`, height: item.start - cursor });
      }
      entries.push({ type: 'row', index: item.index });
      cursor = item.end;
    }
    const total = count * virtual.rowHeight;
    if (total > cursor) {
      entries.push({ type: 'spacer', key: `spacer-${cursor}`, height: total - cursor });
    }
  }

  // Make every control inside a cell leave the tab order: the grid is one tab
  // stop, and Enter or F2 on a cell moves into its controls.
  useEffect(() => {
    if (!keyboardNavigation) {
      return;
    }
    const controls = tableRef.current?.querySelectorAll<HTMLElement>(CELL_CONTENT_SELECTOR) ?? [];
    for (const control of controls) {
      if (control.getAttribute('tabindex') !== '-1') {
        control.setAttribute('tabindex', '-1');
      }
    }
  });

  // After a key moved the active cell, focus it once it is in the document
  // (a far row only mounts after the virtualiser scrolled to it).
  useEffect(() => {
    if (!focusPending.current) {
      return;
    }
    const cell = tableRef.current?.querySelector<HTMLElement>(
      `[data-grid-row="${position.row}"][data-grid-col="${position.column}"]`,
    );
    if (cell) {
      focusPending.current = false;
      cell.focus();
    }
  });

  function pageSize(): number {
    if (virtual) {
      const viewport = virtualizer.scrollRect?.height ?? 0;
      return Math.max(Math.floor((viewport - HEADER_HEIGHT) / virtual.rowHeight), 1);
    }
    const rowHeight =
      tableRef.current?.querySelector('tbody tr')?.getBoundingClientRect().height ?? 0;
    const viewport = Math.min(scrollRef.current?.clientHeight ?? 0, window.innerHeight);
    return rowHeight > 0 && viewport > 0
      ? Math.max(Math.floor(viewport / rowHeight) - 1, 1)
      : DEFAULT_PAGE_SIZE;
  }

  function moveTo(next: GridPosition) {
    focusPending.current = true;
    if (virtual) {
      virtualizer.scrollToIndex(next.row);
    }
    if (next.row === position.row && next.column === position.column) {
      // No state change, so no render: focus now.
      tableRef.current
        ?.querySelector<HTMLElement>(
          `[data-grid-row="${next.row}"][data-grid-col="${next.column}"]`,
        )
        ?.focus();
      focusPending.current = false;
      return;
    }
    setActive(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const table = tableRef.current;
    const target = event.target;
    // React re-dispatches events from portals (menus, dialogs) up the component tree.
    if (!table || !(target instanceof Element) || !table.contains(target)) {
      return;
    }
    const cell = target.closest<HTMLElement>('[data-grid-row]');
    const cellPosition = cell ? positionOf(cell) : null;
    if (!cell || !cellPosition || !table.contains(cell)) {
      return;
    }
    if (event.key === 'Escape') {
      if (cell !== target) {
        event.preventDefault();
        event.stopPropagation();
        cell.focus();
      }
      return;
    }
    // Inside a cell's own control the keys belong to that control.
    if (cell !== target || event.altKey) {
      return;
    }
    if (isGridNavigationKey(event.key)) {
      const next = nextGridPosition(cellPosition, {
        key: event.key,
        ctrl: event.ctrlKey || event.metaKey,
        direction: readDirection(cell, direction),
        rowCount: count,
        columnCount,
        pageSize: pageSize(),
        columnsInRow,
      });
      if (next) {
        event.preventDefault();
        moveTo(next);
      }
      return;
    }
    const content = focusableIn(cell);
    if (event.key === 'Enter' || event.key === 'F2' || event.key === ' ') {
      event.preventDefault();
      const handled =
        event.key !== 'F2' && (onActivate?.(cellPosition.row, content !== undefined) ?? false);
      if (!handled && event.key !== ' ') {
        content?.focus();
      }
    }
  }

  function handleFocus(event: FocusEvent<HTMLTableElement>) {
    const cell = event.target instanceof Element ? event.target.closest('[data-grid-row]') : null;
    const next = cell ? positionOf(cell) : null;
    if (next && (next.row !== position.row || next.column !== position.column)) {
      setActive(next);
    }
  }

  const containerStyle: CSSProperties | undefined = virtual
    ? { maxHeight: virtual.height }
    : undefined;

  return {
    /** Null when rows are not virtualised. */
    virtual,
    entries,
    position,
    scrollRef,
    containerStyle,
    /** Spread on the `<table>`. */
    tableProps: {
      ref: tableRef,
      role: keyboardNavigation ? ('grid' as const) : undefined,
      'aria-rowcount': virtual ? headerRowCount + count : undefined,
      onKeyDown: keyboardNavigation ? handleKeyDown : undefined,
      onFocus: keyboardNavigation ? handleFocus : undefined,
    },
    /** `aria-rowindex` of a header row (0-based) or displayed row, only needed once rows are windowed. */
    rowIndexProps(index: number, header = false): { 'aria-rowindex'?: number } {
      return virtual ? { 'aria-rowindex': header ? index + 1 : headerRowCount + index + 1 } : {};
    },
    rowStyle: virtual ? ({ height: virtual.rowHeight } satisfies CSSProperties) : undefined,
    cellProps(row: number, column: number): GridCellProps {
      if (!keyboardNavigation) {
        return {};
      }
      return {
        role: 'gridcell',
        tabIndex: row === position.row && column === position.column ? 0 : -1,
        className:
          'scroll-mt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        'data-grid-row': row,
        'data-grid-col': column,
      };
    },
  };
}

export { resolveVirtualize, useDataTableGrid, withPinned };
export type {
  DataTableVirtualize,
  DataTableVirtualOptions,
  GridCellProps,
  GridEntry,
  ResolvedVirtual,
  UseDataTableGridOptions,
};
