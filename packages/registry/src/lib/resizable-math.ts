/**
 * Size maths for resizable panel groups. Sizes are percentages of the group
 * and always sum to 100. Kept free of React and the DOM so the rules (what
 * can grow, what is clamped, how RTL flips a drag) are unit-testable.
 */

export interface PanelConstraints {
  /** Smallest size in %. */
  minSize: number;
  /** Largest size in %. */
  maxSize: number;
}

export type Orientation = 'horizontal' | 'vertical';

const EPSILON = 1e-9;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Starting sizes. Panels without a `defaultSize` share what the others leave;
 * the result is scaled to total 100 and then clamped to each panel's limits,
 * with any shortfall handed to panels that still have room.
 */
export function initialSizes(
  defaults: (number | undefined)[],
  constraints: PanelConstraints[],
): number[] {
  const count = defaults.length;
  if (count === 0) {
    return [];
  }
  const specified = defaults.reduce<number>((sum, size) => sum + (size ?? 0), 0);
  const unspecified = defaults.filter((size) => size === undefined).length;
  const share = unspecified > 0 ? Math.max(100 - specified, 0) / unspecified : 0;
  const raw = defaults.map((size) => size ?? share);
  const total = raw.reduce((sum, size) => sum + size, 0);
  const scaled = total > 0 ? raw.map((size) => (size / total) * 100) : raw.map(() => 100 / count);

  const sizes = scaled.map((size, index) => {
    const limits = constraints[index];
    return limits ? clamp(size, limits.minSize, limits.maxSize) : size;
  });

  // Clamping can leave the total off 100; spread the difference over panels
  // that can still move in that direction.
  for (let pass = 0; pass < count; pass += 1) {
    const difference = 100 - sizes.reduce((sum, size) => sum + size, 0);
    if (Math.abs(difference) < EPSILON) {
      break;
    }
    const flexible = sizes
      .map((size, index) => ({ size, limits: constraints[index], index }))
      .filter(({ size, limits }) =>
        limits ? (difference > 0 ? size < limits.maxSize : size > limits.minSize) : true,
      );
    if (flexible.length === 0) {
      break;
    }
    const each = difference / flexible.length;
    for (const { index, limits } of flexible) {
      const current = sizes[index] ?? 0;
      sizes[index] = limits ? clamp(current + each, limits.minSize, limits.maxSize) : current + each;
    }
  }
  return sizes;
}

/** How far the handle can move: the range its preceding panel can span. */
export function resizeRange(
  sizes: number[],
  handleIndex: number,
  constraints: PanelConstraints[],
): { min: number; max: number } {
  const before = sizes[handleIndex];
  const after = sizes[handleIndex + 1];
  const beforeLimits = constraints[handleIndex];
  const afterLimits = constraints[handleIndex + 1];
  if (before === undefined || after === undefined || !beforeLimits || !afterLimits) {
    return { min: before ?? 0, max: before ?? 0 };
  }
  const grow = Math.min(beforeLimits.maxSize - before, after - afterLimits.minSize);
  const shrink = Math.min(before - beforeLimits.minSize, afterLimits.maxSize - after);
  return { min: before - Math.max(shrink, 0), max: before + Math.max(grow, 0) };
}

/**
 * Moves the handle between panel `handleIndex` and the next one by `delta` %
 * (positive grows the preceding panel). Only those two panels change, and the
 * move is clamped so neither leaves its min/max. `±Infinity` snaps to the limit.
 */
export function resizePanels(
  sizes: number[],
  handleIndex: number,
  delta: number,
  constraints: PanelConstraints[],
): number[] {
  const before = sizes[handleIndex];
  const after = sizes[handleIndex + 1];
  if (before === undefined || after === undefined || Number.isNaN(delta)) {
    return sizes;
  }
  const range = resizeRange(sizes, handleIndex, constraints);
  const nextBefore = clamp(before + delta, range.min, range.max);
  const moved = nextBefore - before;
  if (Math.abs(moved) < EPSILON) {
    return sizes;
  }
  const next = [...sizes];
  next[handleIndex] = nextBefore;
  next[handleIndex + 1] = after - moved;
  return next;
}

/**
 * A pointer movement in pixels as a percentage of the group. In a horizontal
 * RTL group the first panel is on the right, so dragging left grows it.
 */
export function pixelsToPercent(
  pixels: number,
  groupPixels: number,
  orientation: Orientation,
  rtl: boolean,
): number {
  if (groupPixels <= 0) {
    return 0;
  }
  const flip = orientation === 'horizontal' && rtl ? -1 : 1;
  return ((pixels * flip) / groupPixels) * 100;
}

/**
 * What a key does to the handle: a delta in %, `±Infinity` for Home/End
 * (snap the preceding panel to its smallest/largest), or null for keys that
 * do nothing. Arrow keys follow the screen: in RTL, ArrowLeft grows the
 * first panel (it sits on the right).
 */
export function keyboardDelta(
  key: string,
  orientation: Orientation,
  rtl: boolean,
  step: number,
): number | null {
  if (key === 'Home') {
    return Number.NEGATIVE_INFINITY;
  }
  if (key === 'End') {
    return Number.POSITIVE_INFINITY;
  }
  if (orientation === 'horizontal') {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (key === forward) {
      return step;
    }
    return key === backward ? -step : null;
  }
  if (key === 'ArrowDown') {
    return step;
  }
  return key === 'ArrowUp' ? -step : null;
}
