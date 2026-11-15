import { describe, expect, it } from 'vitest';
import { resolveSticky, SELECT_COLUMN_ID, type StickyOptions } from '@/lib/data-table-sticky';

const options: StickyOptions = {
  firstColumnId: 'name',
  lastColumnId: 'actions',
  stickyFirstColumn: true,
  stickyLastColumn: true,
  selectable: false,
};

describe('resolveSticky', () => {
  it('lets the column meta win over the table-level flags', () => {
    expect(resolveSticky('name', { sticky: 'end' }, options)).toEqual({ side: 'end' });
    expect(
      resolveSticky('city', { sticky: 'start' }, { ...options, stickyFirstColumn: false }),
    ).toEqual({
      side: 'start',
    });
  });

  it('pins the first and last data columns when asked', () => {
    expect(resolveSticky('name', {}, options)).toEqual({ side: 'start', className: undefined });
    expect(resolveSticky('actions', {}, options)).toEqual({ side: 'end' });
    expect(resolveSticky('city', {}, options)).toEqual({});
  });

  it('pins nothing without the flags', () => {
    const none = { ...options, stickyFirstColumn: false, stickyLastColumn: false };
    expect(resolveSticky('name', {}, none)).toEqual({});
    expect(resolveSticky('actions', {}, none)).toEqual({});
    expect(resolveSticky(SELECT_COLUMN_ID, {}, none)).toEqual({});
  });

  it('pins the selection column and offsets the first data column past it', () => {
    const selectable = { ...options, selectable: true };
    expect(resolveSticky(SELECT_COLUMN_ID, {}, selectable)).toEqual({ side: 'start' });
    expect(resolveSticky('name', {}, selectable)).toEqual({ side: 'start', className: 'start-12' });
  });

  it('leaves the selection column alone when only the last column is pinned', () => {
    const lastOnly = { ...options, stickyFirstColumn: false, selectable: true };
    expect(resolveSticky(SELECT_COLUMN_ID, {}, lastOnly)).toEqual({});
    expect(resolveSticky('actions', {}, lastOnly)).toEqual({ side: 'end' });
  });
});
