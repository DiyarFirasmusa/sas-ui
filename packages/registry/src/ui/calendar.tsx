import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from 'react';
import { CalendarGrid } from '@/components/ui/calendar-grid';
import { CalendarCaption, CalendarNav, type CaptionLayout } from '@/components/ui/calendar-header';
import {
  useMultipleSelection,
  useRangeSelection,
  useSingleSelection,
  type CalendarMultipleProps,
  type CalendarRangeProps,
  type CalendarSingleProps,
  type DateRangeValue,
  type Selection,
} from '@/hooks/use-calendar-selection';
import {
  addCalendarMonths,
  addCalendarYears,
  calendarMonthStart,
  endOfCalendarMonth,
  requireISODate,
  startOfCalendarMonth,
  type CalendarSystem,
} from '@/lib/calendar-systems';
import {
  addDays,
  clampDate,
  compareDays,
  defaultWeekStartsOn,
  endOfWeek,
  getWeekdays,
  isOutOfBounds,
  parseISODate,
  startOfDay,
  startOfWeek,
  toISODate,
  type DateNumerals,
  type WeekStart,
} from '@/lib/date-utils';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'previousMonth' | 'nextMonth' | 'month' | 'year'> = {
  en: { previousMonth: 'Previous month', nextMonth: 'Next month', month: 'Month', year: 'Year' },
  ar: { previousMonth: 'الشهر السابق', nextMonth: 'الشهر التالي', month: 'الشهر', year: 'السنة' },
};

type CalendarLabelKey = keyof typeof messages.en;

interface CalendarCommonProps extends Omit<
  ComponentProps<'div'>,
  'defaultValue' | 'onChange' | 'dir'
> {
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
  /**
   * How days, months and years are counted and named. Values, `min`/`max` and
   * callbacks stay Gregorian ISO strings whatever the system.
   */
  calendarSystem?: CalendarSystem;
  /** A second, smaller day number under each day in another system (Gregorian under Hijri). */
  secondaryCalendar?: CalendarSystem | null;
  /** `dropdowns` puts a month and a year select in the caption. */
  captionLayout?: CaptionLayout;
  numberOfMonths?: 1 | 2;
  /** Always render six weeks so the height does not jump between months. */
  fixedWeeks?: boolean;
  disabled?: boolean;
  /** Navigation still works; days cannot be changed. */
  readOnly?: boolean;
  labels?: Partial<Record<CalendarLabelKey, string>>;
}

type CalendarProps = CalendarCommonProps &
  (CalendarSingleProps | CalendarMultipleProps | CalendarRangeProps);

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
  calendarSystem = 'gregory',
  secondaryCalendar = null,
  captionLayout = 'buttons',
  numberOfMonths = 1,
  fixedWeeks = false,
  disabled = false,
  readOnly = false,
  labels: labelOverrides,
  className,
  onKeyDown,
  ref,
  ...rootProps
}: CalendarViewProps) {
  const { locale, direction } = useLocale();
  const labels = useLabels(messages, labelOverrides);
  const baseId = useId();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      gridRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );
  const pendingFocus = useRef(false);

  const system = calendarSystem;
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);
  const minIso = minDate ? toISODate(minDate) : undefined;
  const maxIso = maxDate ? toISODate(maxDate) : undefined;
  const weekStart = weekStartsOn ?? defaultWeekStartsOn(locale);
  const format = { locale, numerals };
  const today = startOfDay(new Date());

  // Month arithmetic runs in the active calendar system, on Dates the rest of the view already uses.
  const shiftMonths = (date: Date, amount: number): Date =>
    requireISODate(addCalendarMonths(toISODate(date), amount, system));
  const monthStart = (date: Date): Date =>
    requireISODate(startOfCalendarMonth(toISODate(date), system));
  const monthEnd = (date: Date): Date =>
    requireISODate(endOfCalendarMonth(toISODate(date), system));

  const [innerMonth, setInnerMonth] = useState<Date>(
    () => parseISODate(defaultMonth) ?? selection.anchor ?? clampDate(today, minDate, maxDate),
  );
  const displayMonth = monthStart(parseISODate(month) ?? innerMonth);

  const [focused, setFocused] = useState<Date>(() =>
    clampDate(selection.anchor ?? today, minDate, maxDate),
  );

  const months = Array.from({ length: numberOfMonths }, (_, index) =>
    monthStart(shiftMonths(displayMonth, index)),
  );
  const firstVisible = months[0] ?? displayMonth;
  const lastVisibleEnd = monthEnd(months[months.length - 1] ?? displayMonth);
  const isVisible = (date: Date) =>
    compareDays(date, firstVisible) >= 0 && compareDays(date, lastVisibleEnd) <= 0;
  // The one tab stop of the grid: the focused day, or the month's first day when it scrolled away.
  const tabbable = isVisible(focused) ? focused : clampDate(firstVisible, minDate, maxDate);

  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${toISODate(focused)}"]`)?.focus();
  });

  function showMonth(next: Date) {
    const start = monthStart(next);
    setInnerMonth(start);
    onMonthChange?.(toISODate(start));
  }

  function moveMonth(delta: number) {
    showMonth(shiftMonths(displayMonth, delta));
    setFocused(clampDate(shiftMonths(tabbable, delta), minDate, maxDate));
  }

  /** Dropdown choice for the month at `index`; never lands outside the min/max months. */
  function selectMonth(index: number, year: number, monthNumber: number) {
    let target = requireISODate(
      calendarMonthStart(system, year, monthNumber, toISODate(displayMonth)),
    );
    if (minDate && compareDays(target, monthStart(minDate)) < 0) {
      target = monthStart(minDate);
    }
    if (maxDate && compareDays(target, monthStart(maxDate)) > 0) {
      target = monthStart(maxDate);
    }
    showMonth(shiftMonths(target, -index));
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
    } else if (compareDays(next, lastVisibleEnd) > 0) {
      showMonth(shiftMonths(monthStart(next), -(numberOfMonths - 1)));
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
      PageDown: event.shiftKey
        ? requireISODate(addCalendarYears(toISODate(current), 1, system))
        : shiftMonths(current, 1),
      PageUp: event.shiftKey
        ? requireISODate(addCalendarYears(toISODate(current), -1, system))
        : shiftMonths(current, -1),
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
    disabled || (!!maxDate && compareDays(addDays(lastVisibleEnd, 1), maxDate) > 0);

  return (
    <div
      data-slot="calendar"
      ref={setRootRef}
      className={cn('relative flex w-fit flex-col gap-row sm:flex-row sm:gap-card', className)}
      {...rootProps}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        handleKeyDown(event);
      }}
    >
      <CalendarNav
        previousLabel={labels.previousMonth}
        nextLabel={labels.nextMonth}
        previousDisabled={previousDisabled}
        nextDisabled={nextDisabled}
        onPrevious={() => moveMonth(-1)}
        onNext={() => moveMonth(1)}
      />
      {months.map((monthFirst, monthIndex) => {
        const captionId = `${baseId}-caption-${monthIndex}`;
        const monthIso = toISODate(monthFirst);
        return (
          <div key={monthIso} className="gap-field flex flex-col">
            <CalendarCaption
              id={captionId}
              layout={captionLayout}
              monthIso={monthIso}
              system={system}
              format={format}
              min={minIso}
              max={maxIso}
              disabled={disabled}
              monthLabel={labels.month}
              yearLabel={labels.year}
              onSelectMonth={(year, monthNumber) => selectMonth(monthIndex, year, monthNumber)}
            />
            <CalendarGrid
              monthIso={monthIso}
              captionId={captionId}
              system={system}
              secondary={secondaryCalendar}
              format={format}
              weekStartsOn={weekStart}
              weekdays={weekdays}
              fixedWeeks={fixedWeeks}
              selection={selection}
              todayIso={toISODate(today)}
              tabbableIso={toISODate(tabbable)}
              readOnly={readOnly}
              disabled={disabled}
              isUnavailable={isUnavailable}
              onChoose={chooseDay}
              onFocusDay={setFocused}
            />
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
  const selection = useMultipleSelection({
    value,
    defaultValue,
    onValueChange,
  });
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
 * the week's first/last day, PageUp/PageDown change month (Shift: year) in the
 * active calendar system (Gregorian, or Hijri via `calendarSystem`).
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
export type { CalendarCommonProps, CalendarLabelKey, CalendarProps, DateRangeValue };
