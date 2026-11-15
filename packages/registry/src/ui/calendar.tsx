import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  defaultWeekStartsOn,
  endOfWeek,
  formatDateLong,
  formatDayNumber,
  formatMonthYear,
  getMonthGrid,
  getWeekdays,
  isOutOfBounds,
  isSameDay,
  isSameMonth,
  isWithinRange,
  nextRange,
  parseISODate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toISODate,
  type DateNumerals,
  type DayRange,
  type WeekStart,
} from '@/lib/date-utils';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'previousMonth' | 'nextMonth'> = {
  en: { previousMonth: 'Previous month', nextMonth: 'Next month' },
  ar: { previousMonth: 'الشهر السابق', nextMonth: 'الشهر التالي' },
};

type CalendarLabelKey = keyof typeof messages.en;

/** A date range as ISO `yyyy-mm-dd` strings; `to` is null while the user is still picking. */
interface DateRangeValue {
  from: string | null;
  to: string | null;
}

interface CalendarCommonProps
  extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'dir'> {
  /** Any ISO day inside the month to show (controlled). */
  month?: string;
  defaultMonth?: string;
  /** Receives the first day of the month now shown, as an ISO string. */
  onMonthChange?: (month: string) => void;
  /** Earliest / latest selectable day, ISO `yyyy-mm-dd`. */
  min?: string;
  max?: string;
  /** Extra rule for unselectable days (weekends, holidays, booked days…). */
  isDateDisabled?: (date: Date) => boolean;
  /** 0 = Sunday … 6 = Saturday. Defaults to Saturday in Arabic, Sunday in English. */
  weekStartsOn?: WeekStart;
  /** Latin digits by default; `locale` uses Arabic-Indic digits in Arabic. */
  numerals?: DateNumerals;
  numberOfMonths?: 1 | 2;
  /** Always render six weeks so the height does not jump between months. */
  fixedWeeks?: boolean;
  disabled?: boolean;
  /** Navigation still works; days cannot be changed. */
  readOnly?: boolean;
  labels?: Partial<Record<CalendarLabelKey, string>>;
}

interface CalendarSingleProps {
  mode?: 'single';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface CalendarMultipleProps {
  mode: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

interface CalendarRangeProps {
  mode: 'range';
  value?: DateRangeValue | null;
  defaultValue?: DateRangeValue | null;
  onValueChange?: (value: DateRangeValue) => void;
}

type CalendarProps = CalendarCommonProps &
  (CalendarSingleProps | CalendarMultipleProps | CalendarRangeProps);

interface DayState {
  selected: boolean;
  rangeStart?: boolean;
  rangeEnd?: boolean;
  rangeMiddle?: boolean;
}

/** What the grid needs from a selection mode, so the grid itself is mode-agnostic. */
interface Selection {
  /** Where the grid first opens and takes focus: the earliest selected day. */
  anchor: Date | null;
  multiple: boolean;
  select: (date: Date) => void;
  stateOf: (date: Date) => DayState;
}

function useSingleSelection({
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

function useMultipleSelection({
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

function useRangeSelection({
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

const dayClasses = cn(
  'relative flex size-10 items-center justify-center rounded-md text-b2 tabular-nums sm:size-9',
  'cursor-pointer outline-none transition-colors',
  'hover:bg-hover-row',
  'focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring',
  'data-[today]:border data-[today]:border-primary-highlight',
  'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary-hover',
  'data-[range-middle]:rounded-none data-[range-middle]:bg-primary-light data-[range-middle]:text-primary-text data-[range-middle]:hover:bg-primary-light',
  'data-[range-start]:rounded-e-none data-[range-end]:rounded-s-none',
  'aria-disabled:cursor-not-allowed aria-disabled:text-text-inactive aria-disabled:hover:bg-transparent',
  'aria-disabled:data-[selected]:bg-primary/50 aria-disabled:data-[selected]:text-primary-foreground',
  'motion-reduce:transition-none',
);

function parseBound(value: string | undefined): Date | null {
  return parseISODate(value);
}

interface CalendarViewProps extends CalendarCommonProps {
  selection: Selection;
}

function CalendarView({
  selection,
  month,
  defaultMonth,
  onMonthChange,
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  numerals = 'latn',
  numberOfMonths = 1,
  fixedWeeks = false,
  disabled = false,
  readOnly = false,
  labels: labelOverrides,
  className,
  onKeyDown,
  ...rootProps
}: CalendarViewProps) {
  const { locale, direction } = useLocale();
  const labels = useLabels(messages, labelOverrides);
  const baseId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);

  const minDate = parseBound(min);
  const maxDate = parseBound(max);
  const weekStart = weekStartsOn ?? defaultWeekStartsOn(locale);
  const format = { locale, numerals };
  const today = startOfDay(new Date());

  const [innerMonth, setInnerMonth] = useState<Date>(() =>
    startOfMonth(
      parseISODate(defaultMonth) ?? selection.anchor ?? clampDate(today, minDate, maxDate),
    ),
  );
  const controlledMonth = parseISODate(month);
  const displayMonth = controlledMonth ? startOfMonth(controlledMonth) : innerMonth;

  const [focused, setFocused] = useState<Date>(() =>
    clampDate(selection.anchor ?? today, minDate, maxDate),
  );

  const months = Array.from({ length: numberOfMonths }, (_, index) => addMonths(displayMonth, index));
  const firstVisible = months[0] ?? displayMonth;
  const lastVisible = months[months.length - 1] ?? displayMonth;
  const isVisible = (date: Date) =>
    compareDays(date, firstVisible) >= 0 &&
    compareDays(date, addDays(addMonths(lastVisible, 1), -1)) <= 0;
  // The one tab stop of the grid: the focused day, or the month's first day when it scrolled away.
  const tabbable = isVisible(focused) ? focused : clampDate(firstVisible, minDate, maxDate);

  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }
    pendingFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-date="${toISODate(focused)}"]`)
      ?.focus();
  });

  function showMonth(next: Date) {
    const start = startOfMonth(next);
    setInnerMonth(start);
    onMonthChange?.(toISODate(start));
  }

  function moveMonth(delta: number) {
    showMonth(addMonths(displayMonth, delta));
    setFocused(clampDate(addMonths(tabbable, delta), minDate, maxDate));
  }

  function isUnavailable(date: Date): boolean {
    return disabled || isOutOfBounds(date, minDate, maxDate) || (isDateDisabled?.(date) ?? false);
  }

  function chooseDay(date: Date) {
    setFocused(date);
    if (readOnly || isUnavailable(date)) {
      return;
    }
    selection.select(date);
  }

  function moveFocus(target: Date) {
    const next = clampDate(target, minDate, maxDate);
    setFocused(next);
    pendingFocus.current = true;
    if (compareDays(next, firstVisible) < 0) {
      showMonth(next);
    } else if (compareDays(next, addDays(addMonths(lastVisible, 1), -1)) > 0) {
      showMonth(addMonths(next, -(numberOfMonths - 1)));
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = parseISODate(
      event.target instanceof HTMLElement ? event.target.dataset.date : undefined,
    );
    if (!current || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    // Visually-right is the next day in LTR and the previous day in RTL.
    const rightward = direction === 'rtl' ? -1 : 1;
    const targets: Record<string, Date> = {
      ArrowRight: addDays(current, rightward),
      ArrowLeft: addDays(current, -rightward),
      ArrowDown: addDays(current, 7),
      ArrowUp: addDays(current, -7),
      Home: startOfWeek(current, weekStart),
      End: endOfWeek(current, weekStart),
      PageDown: event.shiftKey ? addYears(current, 1) : addMonths(current, 1),
      PageUp: event.shiftKey ? addYears(current, -1) : addMonths(current, -1),
    };
    const target = targets[event.key];
    if (target) {
      event.preventDefault();
      moveFocus(target);
    }
  }

  const weekdays = getWeekdays(weekStart, format);
  const previousDisabled =
    disabled || (!!minDate && compareDays(addDays(firstVisible, -1), minDate) < 0);
  const nextDisabled =
    disabled || (!!maxDate && compareDays(addMonths(lastVisible, 1), maxDate) > 0);

  return (
    <div
      data-slot="calendar"
      ref={gridRef}
      className={cn('relative flex w-fit flex-col gap-row sm:flex-row sm:gap-card', className)}
      {...rootProps}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        handleKeyDown(event);
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="pointer-events-auto"
          aria-label={labels.previousMonth}
          disabled={previousDisabled}
          onClick={() => moveMonth(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="pointer-events-auto"
          aria-label={labels.nextMonth}
          disabled={nextDisabled}
          onClick={() => moveMonth(1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      {months.map((monthStart, monthIndex) => {
        const captionId = `${baseId}-caption-${monthIndex}`;
        return (
          <div key={toISODate(monthStart)} className="flex flex-col gap-field">
            <div
              id={captionId}
              aria-live="polite"
              className="flex h-9 items-center justify-center text-h5 text-text-primary"
            >
              {formatMonthYear(monthStart, format)}
            </div>
            <div>
              <table
                role="grid"
                aria-labelledby={captionId}
                aria-multiselectable={selection.multiple || undefined}
                aria-readonly={readOnly || undefined}
                aria-disabled={disabled || undefined}
                className="border-collapse"
              >
                <thead>
                  <tr>
                    {weekdays.map((weekday) => (
                      <th
                        key={weekday.index}
                        scope="col"
                        aria-label={weekday.long}
                        className="size-10 p-0 text-center text-b3 text-text-muted sm:size-9"
                      >
                        {weekday.narrow}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getMonthGrid(
                    monthStart.getFullYear(),
                    monthStart.getMonth(),
                    weekStart,
                    fixedWeeks,
                  ).map((week) => (
                    <tr key={toISODate(week[0] ?? monthStart)}>
                      {week.map((day) => {
                        if (!isSameMonth(day, monthStart)) {
                          return <td key={toISODate(day)} className="p-0" />;
                        }
                        const state = selection.stateOf(day);
                        const unavailable = isUnavailable(day);
                        return (
                          <td
                            key={toISODate(day)}
                            aria-selected={state.selected}
                            className="p-0 text-center"
                          >
                            <button
                              type="button"
                              data-date={toISODate(day)}
                              data-today={isSameDay(day, today) ? '' : undefined}
                              data-selected={state.selected ? '' : undefined}
                              data-range-start={state.rangeStart ? '' : undefined}
                              data-range-end={state.rangeEnd ? '' : undefined}
                              data-range-middle={state.rangeMiddle ? '' : undefined}
                              aria-label={formatDateLong(day, format)}
                              aria-current={isSameDay(day, today) ? 'date' : undefined}
                              aria-disabled={unavailable || undefined}
                              tabIndex={isSameDay(day, tabbable) ? 0 : -1}
                              onClick={() => chooseDay(day)}
                              onFocus={() => setFocused(day)}
                              className={dayClasses}
                            >
                              {formatDayNumber(day, format)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SingleCalendar({
  mode,
  value,
  defaultValue,
  onValueChange,
  ...rest
}: CalendarCommonProps & CalendarSingleProps) {
  const selection = useSingleSelection({ value, defaultValue, onValueChange });
  return <CalendarView selection={selection} {...rest} />;
}

function MultipleCalendar({
  mode,
  value,
  defaultValue,
  onValueChange,
  ...rest
}: CalendarCommonProps & CalendarMultipleProps) {
  const selection = useMultipleSelection({ value, defaultValue, onValueChange });
  return <CalendarView selection={selection} {...rest} />;
}

function RangeCalendar({
  mode,
  value,
  defaultValue,
  onValueChange,
  ...rest
}: CalendarCommonProps & CalendarRangeProps) {
  const selection = useRangeSelection({ value, defaultValue, onValueChange });
  return <CalendarView selection={selection} {...rest} />;
}

/**
 * Month calendar for single, multiple or range selection. An ARIA grid with
 * one tab stop: arrow keys move by day/week (mirrored in RTL), Home/End go to
 * the week's first/last day, PageUp/PageDown change month (Shift: year).
 * Values are ISO `yyyy-mm-dd` strings; days are local, so no timezone drift.
 */
function Calendar(props: CalendarProps) {
  if (props.mode === 'range') {
    return <RangeCalendar {...props} />;
  }
  if (props.mode === 'multiple') {
    return <MultipleCalendar {...props} />;
  }
  return <SingleCalendar {...props} />;
}

export { Calendar };
export type { CalendarLabelKey, CalendarProps, DateRangeValue };
