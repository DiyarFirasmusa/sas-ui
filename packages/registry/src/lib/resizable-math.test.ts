import { describe, expect, it } from 'vitest';
import {
  initialSizes,
  keyboardDelta,
  pixelsToPercent,
  resizePanels,
  resizeRange,
  type PanelConstraints,
} from '@/lib/resizable-math';

const open: PanelConstraints = { minSize: 0, maxSize: 100 };
const sum = (sizes: number[]) => sizes.reduce((total, size) => total + size, 0);

describe('initialSizes', () => {
  it('splits evenly when nothing is specified', () => {
    expect(initialSizes([undefined, undefined, undefined, undefined], [open, open, open, open])).toEqual([25, 25, 25, 25]);
  });

  it('gives unspecified panels what the others leave', () => {
    expect(initialSizes([30, undefined, undefined], [open, open, open])).toEqual([30, 35, 35]);
  });

  it('scales declared sizes that do not total 100', () => {
    const sizes = initialSizes([20, 20], [open, open]);
    expect(sizes).toEqual([50, 50]);
  });

  it('clamps to the limits and hands the difference to panels with room', () => {
    const sizes = initialSizes(
      [80, 20],
      [{ minSize: 10, maxSize: 60 }, { minSize: 10, maxSize: 100 }],
    );
    expect(sizes).toEqual([60, 40]);
    expect(sum(sizes)).toBeCloseTo(100);
  });

  it('keeps the total at 100 across many panels', () => {
    const sizes = initialSizes(
      [undefined, 10, undefined],
      [{ minSize: 40, maxSize: 100 }, open, { minSize: 5, maxSize: 20 }],
    );
    expect(sum(sizes)).toBeCloseTo(100);
    expect(sizes[0]).toBeGreaterThanOrEqual(40);
    expect(sizes[2]).toBeLessThanOrEqual(20);
  });

  it('handles an empty group', () => {
    expect(initialSizes([], [])).toEqual([]);
  });
});

describe('resizePanels', () => {
  const constraints: PanelConstraints[] = [
    { minSize: 20, maxSize: 70 },
    { minSize: 10, maxSize: 60 },
    open,
  ];

  it('grows the preceding panel and shrinks the next one', () => {
    expect(resizePanels([40, 40, 20], 0, 10, constraints)).toEqual([50, 30, 20]);
  });

  it('shrinks the preceding panel with a negative delta', () => {
    expect(resizePanels([40, 40, 20], 0, -5, constraints)).toEqual([35, 45, 20]);
  });

  it('only changes the two panels around the handle', () => {
    expect(resizePanels([40, 40, 20], 1, 10, constraints)).toEqual([40, 50, 10]);
  });

  it('clamps at the preceding panel minimum', () => {
    expect(resizePanels([40, 40, 20], 0, -50, constraints)).toEqual([20, 60, 20]);
  });

  it('clamps at the preceding panel maximum', () => {
    expect(resizePanels([40, 40, 20], 0, 50, constraints)).toEqual([70, 10, 20]);
  });

  it('respects the next panel limits too', () => {
    // Next panel cannot drop below 10, so the first can only reach 70 here.
    expect(resizePanels([40, 30, 30], 0, 40, constraints)).toEqual([60, 10, 30]);
    // And the next panel cannot exceed 60.
    expect(resizePanels([20, 55, 25], 0, -10, constraints)).toEqual([20, 55, 25]);
  });

  it('snaps to the limit for infinite deltas', () => {
    expect(resizePanels([40, 40, 20], 0, Number.NEGATIVE_INFINITY, constraints)).toEqual([20, 60, 20]);
    expect(resizePanels([40, 40, 20], 0, Number.POSITIVE_INFINITY, constraints)).toEqual([70, 10, 20]);
  });

  it('preserves the total and returns the same array when nothing moves', () => {
    const sizes = [40, 40, 20];
    expect(sum(resizePanels(sizes, 0, 13.7, constraints))).toBeCloseTo(100);
    expect(resizePanels(sizes, 0, 0, constraints)).toBe(sizes);
    expect(resizePanels(sizes, 5, 10, constraints)).toBe(sizes);
    expect(resizePanels(sizes, 0, Number.NaN, constraints)).toBe(sizes);
  });
});

describe('resizeRange', () => {
  it('reports the reachable span for aria-valuemin/max', () => {
    const constraints: PanelConstraints[] = [{ minSize: 20, maxSize: 70 }, { minSize: 10, maxSize: 60 }];
    expect(resizeRange([40, 60], 0, constraints)).toEqual({ min: 40, max: 70 });
  });

  it('is pinned for a missing neighbour', () => {
    expect(resizeRange([100], 0, [open])).toEqual({ min: 100, max: 100 });
  });
});

describe('pixelsToPercent', () => {
  it('converts pixels to a share of the group', () => {
    expect(pixelsToPercent(50, 500, 'horizontal', false)).toBe(10);
    expect(pixelsToPercent(-25, 500, 'vertical', false)).toBe(-5);
  });

  it('flips horizontal drags in RTL only', () => {
    expect(pixelsToPercent(50, 500, 'horizontal', true)).toBe(-10);
    expect(pixelsToPercent(50, 500, 'vertical', true)).toBe(10);
  });

  it('ignores an unmeasured group', () => {
    expect(pixelsToPercent(50, 0, 'horizontal', false)).toBe(0);
  });
});

describe('keyboardDelta', () => {
  it('maps horizontal arrows to the screen in LTR', () => {
    expect(keyboardDelta('ArrowRight', 'horizontal', false, 5)).toBe(5);
    expect(keyboardDelta('ArrowLeft', 'horizontal', false, 5)).toBe(-5);
  });

  it('mirrors horizontal arrows in RTL', () => {
    expect(keyboardDelta('ArrowLeft', 'horizontal', true, 5)).toBe(5);
    expect(keyboardDelta('ArrowRight', 'horizontal', true, 5)).toBe(-5);
  });

  it('uses up/down for vertical groups regardless of direction', () => {
    expect(keyboardDelta('ArrowDown', 'vertical', true, 5)).toBe(5);
    expect(keyboardDelta('ArrowUp', 'vertical', false, 5)).toBe(-5);
    expect(keyboardDelta('ArrowLeft', 'vertical', false, 5)).toBeNull();
  });

  it('snaps with Home and End and ignores other keys', () => {
    expect(keyboardDelta('Home', 'horizontal', false, 5)).toBe(Number.NEGATIVE_INFINITY);
    expect(keyboardDelta('End', 'vertical', true, 5)).toBe(Number.POSITIVE_INFINITY);
    expect(keyboardDelta('a', 'horizontal', false, 5)).toBeNull();
    expect(keyboardDelta('ArrowUp', 'horizontal', false, 5)).toBeNull();
  });
});
