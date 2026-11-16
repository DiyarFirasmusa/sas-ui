import { describe, expect, it } from 'vitest';
import {
  centerScrollLeft,
  resolveStages,
  segmentClipPath,
  segmentPosition,
  type StageState,
} from '@/lib/status-bar';

interface Stage {
  id: string;
  state?: StageState;
}

const pipeline: Stage[] = [{ id: 'draft' }, { id: 'review' }, { id: 'approved' }, { id: 'paid' }];
const terminal: Stage[] = [{ id: 'rejected' }, { id: 'cancelled' }];

function states(current: string, stages: Stage[] = pipeline, ends: Stage[] = terminal) {
  return resolveStages(stages, ends, current).map((item) => item.state);
}

describe('resolveStages', () => {
  it('marks earlier stages complete and later ones upcoming', () => {
    expect(states('approved')).toEqual([
      'complete',
      'complete',
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('starts with the first stage current and ends with the last', () => {
    expect(states('draft').slice(0, 4)).toEqual(['current', 'upcoming', 'upcoming', 'upcoming']);
    expect(states('paid').slice(0, 4)).toEqual(['complete', 'complete', 'complete', 'current']);
  });

  it('flags exactly the current stage', () => {
    const resolved = resolveStages(pipeline, terminal, 'review');
    expect(resolved.filter((item) => item.isCurrent).map((item) => item.stage.id)).toEqual([
      'review',
    ]);
  });

  it('shows a current terminal stage as an error and leaves the pipeline upcoming', () => {
    expect(states('rejected')).toEqual([
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
      'error',
      'upcoming',
    ]);
    const resolved = resolveStages(pipeline, terminal, 'rejected');
    expect(resolved.map((item) => item.terminal)).toEqual([false, false, false, false, true, true]);
    expect(resolved[4]?.isCurrent).toBe(true);
  });

  it('lets an explicit state win, so a rejected record can keep its earlier progress', () => {
    const stages: Stage[] = [
      { id: 'draft', state: 'complete' },
      { id: 'review', state: 'error' },
      { id: 'approved', state: 'skipped' },
      { id: 'paid' },
    ];
    expect(states('review', stages)).toEqual([
      'complete',
      'error',
      'skipped',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    expect(states('rejected', stages)[0]).toBe('complete');
  });

  it('keeps everything upcoming when current is unknown', () => {
    expect(states('nope')).toEqual(Array.from({ length: 6 }, () => 'upcoming'));
    expect(resolveStages(pipeline, terminal, 'nope').some((item) => item.isCurrent)).toBe(false);
  });

  it('handles an empty pipeline and no terminal stages', () => {
    expect(resolveStages([], [], 'x')).toEqual([]);
    expect(states('review', pipeline, [])).toEqual(['complete', 'current', 'upcoming', 'upcoming']);
  });
});

describe('segmentPosition', () => {
  it('names the ends', () => {
    expect([0, 1, 2, 3].map((index) => segmentPosition(index, 4))).toEqual([
      'first',
      'middle',
      'middle',
      'last',
    ]);
    expect(segmentPosition(0, 2)).toBe('first');
    expect(segmentPosition(1, 2)).toBe('last');
    expect(segmentPosition(0, 1)).toBe('only');
  });
});

describe('segmentClipPath', () => {
  const d = '0.75rem';

  it('points the first segment at the end edge, with a flat start (LTR)', () => {
    expect(segmentClipPath('first', 'ltr')).toBe(
      `polygon(0 0, calc(100% - ${d}) 0, 100% 50%, calc(100% - ${d}) 100%, 0 100%)`,
    );
  });

  it('points the end and notches the start of a middle segment (LTR)', () => {
    expect(segmentClipPath('middle', 'ltr')).toBe(
      `polygon(0 0, calc(100% - ${d}) 0, 100% 50%, calc(100% - ${d}) 100%, 0 100%, ${d} 50%)`,
    );
  });

  it('notches the start and ends flat on the last segment (LTR)', () => {
    expect(segmentClipPath('last', 'ltr')).toBe(
      `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${d} 50%)`,
    );
  });

  it('does not clip a lone segment', () => {
    expect(segmentClipPath('only', 'ltr')).toBe('none');
    expect(segmentClipPath('only', 'rtl')).toBe('none');
  });

  it('mirrors every polygon in RTL so the arrows point left', () => {
    expect(segmentClipPath('first', 'rtl')).toBe(
      `polygon(100% 0, ${d} 0, 0 50%, ${d} 100%, 100% 100%)`,
    );
    expect(segmentClipPath('middle', 'rtl')).toBe(
      `polygon(100% 0, ${d} 0, 0 50%, ${d} 100%, 100% 100%, calc(100% - ${d}) 50%)`,
    );
    expect(segmentClipPath('last', 'rtl')).toBe(
      `polygon(100% 0, 0 0, 0 100%, 100% 100%, calc(100% - ${d}) 50%)`,
    );
  });

  it('points toward the inline end: the arrow tip is on the right in LTR and the left in RTL', () => {
    const tipOf = (polygon: string) => polygon.split(', ').find((point) => point.endsWith(' 50%'));
    expect(tipOf(segmentClipPath('first', 'ltr'))).toBe('100% 50%');
    expect(tipOf(segmentClipPath('first', 'rtl'))).toBe('0 50%');
  });

  it('is an exact horizontal mirror of the LTR polygon', () => {
    const flip = (value: string) =>
      value === '0'
        ? '100%'
        : value === '100%'
          ? '0'
          : value === d
            ? `calc(100% - ${d})`
            : value === `calc(100% - ${d})`
              ? d
              : value;
    for (const position of ['first', 'middle', 'last'] as const) {
      const body = (polygon: string) => polygon.slice('polygon('.length, -1).split(', ');
      const mirrored = body(segmentClipPath(position, 'ltr')).map((point) => {
        const [px = '', py = ''] = point.split(/ (?=[\d]+%?$)/);
        return `${flip(px)} ${py}`;
      });
      expect(body(segmentClipPath(position, 'rtl'))).toEqual(mirrored);
    }
  });

  it('accepts another arrow depth', () => {
    expect(segmentClipPath('first', 'ltr', '1rem')).toContain('calc(100% - 1rem) 0');
  });
});

describe('centerScrollLeft', () => {
  const base = { itemWidth: 100, clientWidth: 400, scrollWidth: 1000 };

  it('centres the item in LTR', () => {
    expect(centerScrollLeft({ ...base, offsetLeft: 450, direction: 'ltr' })).toBe(300);
  });

  it('clamps to the ends', () => {
    expect(centerScrollLeft({ ...base, offsetLeft: 0, direction: 'ltr' })).toBe(0);
    expect(centerScrollLeft({ ...base, offsetLeft: 900, direction: 'ltr' })).toBe(600);
  });

  it('uses the negative scroll range in RTL', () => {
    // The visible window starts 300px from the left, so the RTL offset is 300 - 600.
    expect(centerScrollLeft({ ...base, offsetLeft: 450, direction: 'rtl' })).toBe(-300);
    expect(centerScrollLeft({ ...base, offsetLeft: 900, direction: 'rtl' })).toBe(0);
    expect(centerScrollLeft({ ...base, offsetLeft: 0, direction: 'rtl' })).toBe(-600);
  });

  it('does not scroll when everything fits', () => {
    expect(
      centerScrollLeft({
        offsetLeft: 50,
        itemWidth: 100,
        clientWidth: 400,
        scrollWidth: 400,
        direction: 'ltr',
      }),
    ).toBe(0);
    expect(
      centerScrollLeft({
        offsetLeft: 50,
        itemWidth: 100,
        clientWidth: 400,
        scrollWidth: 400,
        direction: 'rtl',
      }),
    ).toBe(0);
  });
});
