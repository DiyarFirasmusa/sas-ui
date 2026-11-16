import { describe, expect, it } from 'vitest';
import {
  clampGridPosition,
  isGridNavigationKey,
  nextGridPosition,
  type GridDirection,
  type GridPosition,
} from '@/lib/data-table-navigation';

const grid = { rowCount: 10, columnCount: 4, pageSize: 3 };

function move(
  position: GridPosition,
  key: string,
  direction: GridDirection = 'ltr',
  extra: { ctrl?: boolean } = {},
) {
  return nextGridPosition(position, { key, direction, ...grid, ...extra });
}

describe('isGridNavigationKey', () => {
  it('knows the movement keys and nothing else', () => {
    for (const key of [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ]) {
      expect(isGridNavigationKey(key)).toBe(true);
    }
    for (const key of ['Enter', 'F2', 'Escape', ' ', 'a', 'Tab']) {
      expect(isGridNavigationKey(key)).toBe(false);
    }
  });
});

describe('nextGridPosition vertical movement', () => {
  it('moves down and up one row, keeping the column', () => {
    expect(move({ row: 2, column: 1 }, 'ArrowDown')).toEqual({ row: 3, column: 1 });
    expect(move({ row: 2, column: 1 }, 'ArrowUp')).toEqual({ row: 1, column: 1 });
  });

  it.each(['ltr', 'rtl'] as const)('does not wrap at the first or last row (%s)', (direction) => {
    expect(move({ row: 0, column: 2 }, 'ArrowUp', direction)).toEqual({ row: 0, column: 2 });
    expect(move({ row: 9, column: 2 }, 'ArrowDown', direction)).toEqual({ row: 9, column: 2 });
  });

  it('jumps a page with PageDown and PageUp and clamps at the edges', () => {
    expect(move({ row: 2, column: 1 }, 'PageDown')).toEqual({ row: 5, column: 1 });
    expect(move({ row: 8, column: 1 }, 'PageDown')).toEqual({ row: 9, column: 1 });
    expect(move({ row: 5, column: 1 }, 'PageUp')).toEqual({ row: 2, column: 1 });
    expect(move({ row: 1, column: 1 }, 'PageUp')).toEqual({ row: 0, column: 1 });
  });

  it('moves at least one row for a page size of zero or less', () => {
    const base = { key: 'PageDown', direction: 'ltr' as const, rowCount: 10, columnCount: 4 };
    expect(nextGridPosition({ row: 2, column: 0 }, { ...base, pageSize: 0 })).toEqual({
      row: 3,
      column: 0,
    });
    expect(nextGridPosition({ row: 2, column: 0 }, { ...base, pageSize: -5 })).toEqual({
      row: 3,
      column: 0,
    });
    expect(nextGridPosition({ row: 2, column: 0 }, { ...base, pageSize: 2.9 })).toEqual({
      row: 4,
      column: 0,
    });
  });
});

describe('nextGridPosition horizontal movement', () => {
  it('in LTR ArrowRight is the next cell and ArrowLeft the previous one', () => {
    expect(move({ row: 1, column: 1 }, 'ArrowRight', 'ltr')).toEqual({ row: 1, column: 2 });
    expect(move({ row: 1, column: 1 }, 'ArrowLeft', 'ltr')).toEqual({ row: 1, column: 0 });
  });

  it('in RTL ArrowLeft is the next cell and ArrowRight the previous one', () => {
    expect(move({ row: 1, column: 1 }, 'ArrowLeft', 'rtl')).toEqual({ row: 1, column: 2 });
    expect(move({ row: 1, column: 1 }, 'ArrowRight', 'rtl')).toEqual({ row: 1, column: 0 });
  });

  it.each([
    ['ltr', 'ArrowLeft', 0],
    ['ltr', 'ArrowRight', 3],
    ['rtl', 'ArrowRight', 0],
    ['rtl', 'ArrowLeft', 3],
  ] as const)('does not wrap past the row edge (%s %s)', (direction, key, column) => {
    expect(move({ row: 4, column }, key, direction)).toEqual({ row: 4, column });
  });

  it('keeps the row when moving sideways', () => {
    expect(move({ row: 7, column: 0 }, 'ArrowRight', 'ltr')?.row).toBe(7);
    expect(move({ row: 7, column: 0 }, 'ArrowLeft', 'rtl')?.row).toBe(7);
  });
});

describe('nextGridPosition Home and End', () => {
  it.each(['ltr', 'rtl'] as const)('Home and End are the row start and end in %s', (direction) => {
    expect(move({ row: 4, column: 2 }, 'Home', direction)).toEqual({ row: 4, column: 0 });
    expect(move({ row: 4, column: 1 }, 'End', direction)).toEqual({ row: 4, column: 3 });
  });

  it.each(['ltr', 'rtl'] as const)(
    'Ctrl+Home and Ctrl+End reach the grid corners in %s',
    (direction) => {
      expect(move({ row: 4, column: 2 }, 'Home', direction, { ctrl: true })).toEqual({
        row: 0,
        column: 0,
      });
      expect(move({ row: 4, column: 2 }, 'End', direction, { ctrl: true })).toEqual({
        row: 9,
        column: 3,
      });
    },
  );
});

describe('nextGridPosition rows with a different number of cells', () => {
  const columnsInRow = (row: number) => (row === 3 ? 1 : 4);
  const options = { direction: 'ltr' as const, ...grid, columnsInRow };

  it('clamps the column when moving onto a spanning row and does not move sideways inside it', () => {
    expect(nextGridPosition({ row: 2, column: 3 }, { ...options, key: 'ArrowDown' })).toEqual({
      row: 3,
      column: 0,
    });
    expect(nextGridPosition({ row: 3, column: 0 }, { ...options, key: 'ArrowRight' })).toEqual({
      row: 3,
      column: 0,
    });
    expect(nextGridPosition({ row: 3, column: 0 }, { ...options, key: 'End' })).toEqual({
      row: 3,
      column: 0,
    });
  });

  it('uses the last row own column count for Ctrl+End', () => {
    expect(
      nextGridPosition(
        { row: 0, column: 0 },
        { ...options, key: 'End', ctrl: true, columnsInRow: (row) => (row === 9 ? 2 : 4) },
      ),
    ).toEqual({ row: 9, column: 1 });
  });
});

describe('nextGridPosition edge cases', () => {
  it('returns null for keys that are not movement and for empty grids', () => {
    expect(move({ row: 0, column: 0 }, 'Enter')).toBeNull();
    expect(move({ row: 0, column: 0 }, 'F2')).toBeNull();
    expect(
      nextGridPosition(
        { row: 0, column: 0 },
        { key: 'ArrowDown', direction: 'ltr', rowCount: 0, columnCount: 3, pageSize: 5 },
      ),
    ).toBeNull();
    expect(
      nextGridPosition(
        { row: 0, column: 0 },
        { key: 'ArrowDown', direction: 'ltr', rowCount: 3, columnCount: 0, pageSize: 5 },
      ),
    ).toBeNull();
  });

  it('first clamps a position that no longer exists', () => {
    expect(move({ row: 50, column: 50 }, 'ArrowUp')).toEqual({ row: 8, column: 3 });
    expect(move({ row: -3, column: -3 }, 'ArrowDown')).toEqual({ row: 1, column: 0 });
  });

  it('works on a one-cell grid', () => {
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      expect(
        nextGridPosition(
          { row: 0, column: 0 },
          { key, direction: 'rtl', rowCount: 1, columnCount: 1, pageSize: 1 },
        ),
      ).toEqual({ row: 0, column: 0 });
    }
  });
});

describe('clampGridPosition', () => {
  it('keeps positions inside the grid', () => {
    expect(clampGridPosition({ row: 12, column: 9 }, 5, 3)).toEqual({ row: 4, column: 2 });
    expect(clampGridPosition({ row: -1, column: -1 }, 5, 3)).toEqual({ row: 0, column: 0 });
    expect(clampGridPosition({ row: 1, column: 1 }, 0, 0)).toEqual({ row: 0, column: 0 });
  });
});
