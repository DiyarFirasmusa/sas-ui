export type GridDirection = 'ltr' | 'rtl';

export interface GridPosition {
  /** Index of the row in the displayed rows (group header rows count), 0-based. */
  row: number;
  /** Index of the cell in the row, 0-based, in DOM order. */
  column: number;
}

export interface GridMoveOptions {
  /** `KeyboardEvent.key`. */
  key: string;
  /** Ctrl (or Cmd) held: turns Home/End into "first/last cell of the grid". */
  ctrl?: boolean;
  /** Reading direction; the horizontal arrow keys follow it. */
  direction: GridDirection;
  rowCount: number;
  columnCount: number;
  /** How many rows PageUp and PageDown jump. At least one row is always moved. */
  pageSize: number;
  /** Number of cells in a row. Group header rows span the table and have one. Defaults to `columnCount`. */
  columnsInRow?: (row: number) => number;
}

const NAVIGATION_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

/** Keys that move the active cell. Enter, F2, Escape and Space are not movement and are handled by the caller. */
export function isGridNavigationKey(key: string): boolean {
  return NAVIGATION_KEYS.has(key);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Keeps a position inside the grid, for when rows or columns disappeared since it was set. */
export function clampGridPosition(
  position: GridPosition,
  rowCount: number,
  columnCount: number,
  columnsInRow?: (row: number) => number,
): GridPosition {
  const row = clamp(position.row, 0, Math.max(rowCount - 1, 0));
  const columns = Math.max(columnsInRow ? columnsInRow(row) : columnCount, 1);
  return { row, column: clamp(position.column, 0, columns - 1) };
}

/**
 * Where the active cell goes for a key, following the WAI-ARIA grid pattern
 * (no wrapping at the edges). Left and right are logical: in a right-to-left
 * grid ArrowLeft moves to the NEXT cell and ArrowRight to the previous one,
 * because the next cell sits on the left. Home and End mean the start and end
 * of the row in either direction.
 *
 * Returns `null` when the key is not a movement key or the grid is empty, so
 * the caller leaves the event alone; otherwise the (possibly unchanged) position.
 */
export function nextGridPosition(
  position: GridPosition,
  options: GridMoveOptions,
): GridPosition | null {
  const { key, ctrl = false, direction, rowCount, columnCount, pageSize, columnsInRow } = options;
  if (!isGridNavigationKey(key) || rowCount <= 0 || columnCount <= 0) {
    return null;
  }
  const columnsOf = (row: number) => Math.max(columnsInRow ? columnsInRow(row) : columnCount, 1);
  const current = clampGridPosition(position, rowCount, columnCount, columnsInRow);
  const lastRow = rowCount - 1;
  const step = direction === 'rtl' ? -1 : 1;
  const page = Math.max(Math.floor(pageSize), 1);

  const moveToRow = (row: number): GridPosition => {
    const target = clamp(row, 0, lastRow);
    return { row: target, column: Math.min(current.column, columnsOf(target) - 1) };
  };

  switch (key) {
    case 'ArrowDown':
      return moveToRow(current.row + 1);
    case 'ArrowUp':
      return moveToRow(current.row - 1);
    case 'PageDown':
      return moveToRow(current.row + page);
    case 'PageUp':
      return moveToRow(current.row - page);
    case 'ArrowRight':
      return {
        row: current.row,
        column: clamp(current.column + step, 0, columnsOf(current.row) - 1),
      };
    case 'ArrowLeft':
      return {
        row: current.row,
        column: clamp(current.column - step, 0, columnsOf(current.row) - 1),
      };
    case 'Home':
      return ctrl ? { row: 0, column: 0 } : { row: current.row, column: 0 };
    case 'End':
      return ctrl
        ? { row: lastRow, column: columnsOf(lastRow) - 1 }
        : { row: current.row, column: columnsOf(current.row) - 1 };
    default:
      return null;
  }
}
