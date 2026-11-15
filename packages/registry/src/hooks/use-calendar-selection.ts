import { useState } from 'react';
import {
  compareDays,
  isSameDay,
  isWithinRange,
  nextRange,
  parseISODate,
  toISODate,
  type DayRange,
} from '@/lib/date-utils';

/** A date range as ISO `yyyy-mm-dd` strings; `to` is null while the user is still picking. */
export interface DateRangeValue {
  from: string | null;
  to: string | null;
}

export interface CalendarSingleProps {
  mode?: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export interface CalendarMultipleProps {
  mode: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export interface CalendarRangeProps {
  mode: 'range';
  value?: DateRangeValue | null;
  defaultValue?: DateRangeValue | null;
  onValueChange?: (value: DateRangeValue) => void;
}

export interface DayState {
  selected: boolean;
  rangeStart?: boolean;
  rangeEnd?: boolean;
  rangeMiddle?: boolean;
}

/** What the grid needs from a selection mode, so the grid itself is mode-agnostic. */
export interface Selection {
  /** Where the grid first opens and takes focus: the earliest selected day. */
  anchor: Date | null;
  multiple: boolean;
  select: (date: Date) => void;
  stateOf: (date: Date) => DayState;
}

export function useSingleSelection({
  value,
  defaultValue = null,
  onValueChange,
}: Omit<CalendarSingleProps, 'mode'>): Selection {
  const [inner, setInner] = useState<string | null>(defaultValue);
  const current = value === undefined ? inner : value;
  return {
    anchor: parseISODate(current),
    multiple: false,
    select(date) {
      const next = toISODate(date);
      setInner(next);
      onValueChange?.(next);
    },
    stateOf: (date) => ({ selected: toISODate(date) === current }),
  };
}

export function useMultipleSelection({
  value,
  defaultValue,
  onValueChange,
}: Omit<CalendarMultipleProps, 'mode'>): Selection {
  const [inner, setInner] = useState<string[]>(defaultValue ?? []);
  const current = value ?? inner;
  const first = [...current].sort()[0];
  return {
    anchor: parseISODate(first),
    multiple: true,
    select(date) {
      const iso = toISODate(date);
      const next = current.includes(iso)
        ? current.filter((entry) => entry !== iso)
        : [...current, iso].sort();
      setInner(next);
      onValueChange?.(next);
    },
    stateOf: (date) => ({ selected: current.includes(toISODate(date)) }),
  };
}

export function useRangeSelection({
  value,
  defaultValue,
  onValueChange,
}: Omit<CalendarRangeProps, 'mode'>): Selection {
  const [inner, setInner] = useState<DateRangeValue | null>(defaultValue ?? null);
  const current = value === undefined ? inner : value;
  const range: DayRange = {
    from: parseISODate(current?.from),
    to: parseISODate(current?.to),
  };
  // A value written backwards (to < from) is still one range; draw it ordered.
  const [start, end] =
    range.from && range.to && compareDays(range.from, range.to) > 0
      ? [range.to, range.from]
      : [range.from, range.to];
  return {
    anchor: start,
    multiple: true,
    select(date) {
      const next = nextRange(range, date);
      const result = {
        from: next.from ? toISODate(next.from) : null,
        to: next.to ? toISODate(next.to) : null,
      };
      setInner(result);
      onValueChange?.(result);
    },
    stateOf(date) {
      const selected = isWithinRange(date, start, end);
      const isStart = isSameDay(date, start);
      const isEnd = isSameDay(date, end);
      return {
        selected,
        rangeStart: isStart && !!end && !isSameDay(start, end),
        rangeEnd: isEnd && !!start && !isSameDay(start, end),
        rangeMiddle: selected && !isStart && !isEnd,
      };
    },
  };
}
