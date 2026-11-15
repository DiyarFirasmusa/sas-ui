import { describe, expect, it } from 'vitest';
import { getPageCount, getPageWindow, getRowRange } from '@/lib/page-window';

describe('getPageWindow', () => {
  it('lists every page when they all fit', () => {
    expect(getPageWindow(1, 1)).toEqual([1]);
    expect(getPageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('returns nothing without pages', () => {
    expect(getPageWindow(1, 0)).toEqual([]);
  });

  it('collapses the end when near the start', () => {
    expect(getPageWindow(1, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
    expect(getPageWindow(3, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
  });

  it('collapses the start when near the end', () => {
    expect(getPageWindow(20, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
    expect(getPageWindow(18, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
  });

  it('shows both ellipses in the middle', () => {
    expect(getPageWindow(10, 20)).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 20]);
  });

  it('keeps the same length while the page moves', () => {
    const lengths = new Set(Array.from({ length: 20 }, (_, index) => getPageWindow(index + 1, 20).length));
    expect(lengths).toEqual(new Set([7]));
  });

  it('honours the sibling count', () => {
    expect(getPageWindow(10, 30, 2)).toEqual([1, 'start-ellipsis', 8, 9, 10, 11, 12, 'end-ellipsis', 30]);
    expect(getPageWindow(1, 30, 0)).toEqual([1, 2, 3, 'end-ellipsis', 30]);
  });

  it('clamps an out-of-range page', () => {
    expect(getPageWindow(99, 20)).toEqual(getPageWindow(20, 20));
    expect(getPageWindow(-4, 20)).toEqual(getPageWindow(1, 20));
  });
});

describe('getPageCount', () => {
  it('rounds up and never drops below one page', () => {
    expect(getPageCount(0, 10)).toBe(1);
    expect(getPageCount(10, 10)).toBe(1);
    expect(getPageCount(11, 10)).toBe(2);
    expect(getPageCount(95, 10)).toBe(10);
  });

  it('guards a zero page size', () => {
    expect(getPageCount(50, 0)).toBe(1);
  });
});

describe('getRowRange', () => {
  it('gives the inclusive range for a page', () => {
    expect(getRowRange(1, 10, 95)).toEqual({ from: 1, to: 10 });
    expect(getRowRange(10, 10, 95)).toEqual({ from: 91, to: 95 });
  });

  it('returns null when there is nothing to show', () => {
    expect(getRowRange(1, 10, 0)).toBeNull();
    expect(getRowRange(5, 10, 20)).toBeNull();
    expect(getRowRange(1, 0, 20)).toBeNull();
  });
});
