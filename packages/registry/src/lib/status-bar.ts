import type { Direction } from '@/lib/locale';

export type StageState = 'complete' | 'current' | 'upcoming' | 'error' | 'skipped';

/** Where a segment sits in the strip; it decides which of its two ends is an arrow. */
export type SegmentPosition = 'first' | 'middle' | 'last' | 'only';

interface StageLike {
  id: string;
  state?: StageState;
}

export interface ResolvedStage<Stage extends StageLike> {
  stage: Stage;
  state: StageState;
  isCurrent: boolean;
  terminal: boolean;
}

/**
 * The state of every stage, pipeline first and terminal stages after it.
 * An explicit `state` always wins. Otherwise, with the current stage inside
 * the pipeline, earlier stages are complete and later ones upcoming. With a
 * terminal stage current (rejected, cancelled) it is an error, and the
 * pipeline stays upcoming because nothing says how far the record got: pass
 * explicit states to keep earlier stages shown as complete. An unknown
 * `current` leaves everything upcoming.
 */
export function resolveStages<Stage extends StageLike>(
  stages: readonly Stage[],
  terminal: readonly Stage[],
  current: string,
): ResolvedStage<Stage>[] {
  const currentIndex = stages.findIndex((stage) => stage.id === current);
  const pipeline = stages.map((stage, index): ResolvedStage<Stage> => {
    const derived: StageState =
      currentIndex < 0
        ? 'upcoming'
        : index < currentIndex
          ? 'complete'
          : index === currentIndex
            ? 'current'
            : 'upcoming';
    return {
      stage,
      state: stage.state ?? derived,
      isCurrent: stage.id === current,
      terminal: false,
    };
  });
  const ends = terminal.map((stage): ResolvedStage<Stage> => {
    const isCurrent = stage.id === current;
    return {
      stage,
      state: stage.state ?? (isCurrent ? 'error' : 'upcoming'),
      isCurrent,
      terminal: true,
    };
  });
  return [...pipeline, ...ends];
}

/** Which end(s) of a pipeline segment is an arrow, from its index. */
export function segmentPosition(index: number, count: number): SegmentPosition {
  if (count <= 1) {
    return 'only';
  }
  if (index === 0) {
    return 'first';
  }
  return index === count - 1 ? 'last' : 'middle';
}

type Edge = 'start' | 'end';

/** One x coordinate: on the inline `edge`, `inset` away from it (0 = on the edge, 1 = one arrow depth in). */
function x(edge: Edge, inset: 0 | 1, direction: Direction, depth: string): string {
  // The inline start is the left edge in LTR and the right edge in RTL.
  const fromLeft = (edge === 'start') === (direction === 'ltr');
  if (fromLeft) {
    return inset === 0 ? '0' : depth;
  }
  return inset === 0 ? '100%' : `calc(100% - ${depth})`;
}

/**
 * `clip-path` that cuts a segment into an arrow pointing at the inline end:
 * a point on the end edge (unless it is the last segment) and a matching
 * notch on the start edge (unless it is the first). In RTL the same polygon
 * is mirrored, so the arrows point left. Plain `none` for a lone segment.
 */
export function segmentClipPath(
  position: SegmentPosition,
  direction: Direction,
  depth = '0.75rem',
): string {
  const pointed = position === 'first' || position === 'middle';
  const notched = position === 'middle' || position === 'last';
  const at = (edge: Edge, inset: 0 | 1) => x(edge, inset, direction, depth);
  const points: string[] = [
    `${at('start', 0)} 0`,
    `${at('end', pointed ? 1 : 0)} 0`,
    ...(pointed ? [`${at('end', 0)} 50%`] : []),
    `${at('end', pointed ? 1 : 0)} 100%`,
    `${at('start', 0)} 100%`,
    ...(notched ? [`${at('start', 1)} 50%`] : []),
  ];
  return position === 'only' ? 'none' : `polygon(${points.join(', ')})`;
}

/**
 * The `scrollLeft` that centres an item in a horizontally scrolling strip.
 * RTL containers scroll from the right edge, so `scrollLeft` runs from 0 down
 * to `-(scrollWidth - clientWidth)` there. The result is clamped to that range.
 */
export function centerScrollLeft({
  offsetLeft,
  itemWidth,
  clientWidth,
  scrollWidth,
  direction,
}: {
  offsetLeft: number;
  itemWidth: number;
  clientWidth: number;
  scrollWidth: number;
  direction: Direction;
}): number {
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const viewLeft = Math.min(maxScroll, Math.max(0, offsetLeft + itemWidth / 2 - clientWidth / 2));
  return direction === 'ltr' ? viewLeft : viewLeft - maxScroll;
}
