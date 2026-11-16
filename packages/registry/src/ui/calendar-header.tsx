import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { controlClasses } from '@/components/ui/input';
import {
  calendarMonthStart,
  endOfCalendarMonth,
  formatCalendarMonthYear,
  getCalendarMonthNames,
  getCalendarYearRange,
  toCalendarDate,
  type CalendarSystem,
} from '@/lib/calendar-systems';
import type { DateFormatOptions } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

type CaptionLayout = 'buttons' | 'dropdowns';

interface CalendarNavProps {
  previousLabel: string;
  nextLabel: string;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/** Previous/next buttons, laid over the top edge of the calendar. The chevrons mirror in RTL. */
function CalendarNav({
  previousLabel,
  nextLabel,
  previousDisabled,
  nextDisabled,
  onPrevious,
  onNext,
}: CalendarNavProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="pointer-events-auto"
        aria-label={previousLabel}
        disabled={previousDisabled}
        onClick={onPrevious}
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="pointer-events-auto"
        aria-label={nextLabel}
        disabled={nextDisabled}
        onClick={onNext}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}

const selectClasses = cn(
  controlClasses,
  'h-8 w-auto cursor-pointer appearance-none ps-2 pe-7 text-b2',
  'data-[disabled]:cursor-not-allowed',
);

interface CaptionSelectProps {
  label: string;
  value: number;
  disabled: boolean;
  options: readonly { value: number; label: string; disabled?: boolean }[];
  onChange: (value: number) => void;
}

/** A native select: it keeps the picker's popover open and gives phones their own wheel. */
function CaptionSelect({ label, value, disabled, options, onChange }: CaptionSelectProps) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        data-disabled={disabled ? '' : undefined}
        className={selectClasses}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="text-text-muted pointer-events-none absolute end-2 top-1/2 size-4 -translate-y-1/2" />
    </span>
  );
}

interface CalendarCaptionProps {
  /** Id the grid points at with `aria-labelledby`. */
  id: string;
  layout: CaptionLayout;
  /** Any ISO day inside the month shown. */
  monthIso: string;
  system: CalendarSystem;
  format: DateFormatOptions;
  /** ISO bounds; months and years outside them are not offered. */
  min?: string;
  max?: string;
  disabled: boolean;
  monthLabel: string;
  yearLabel: string;
  /** Called with the Hijri/Gregorian year and month (1-12) the user picked. */
  onSelectMonth: (year: number, month: number) => void;
}

/**
 * The month title. `buttons` is plain live text (the previous/next buttons do
 * the navigating); `dropdowns` adds a month and a year select. In both the
 * title text carries `id` and is announced politely when it changes.
 */
function CalendarCaption({
  id,
  layout,
  monthIso,
  system,
  format,
  min,
  max,
  disabled,
  monthLabel,
  yearLabel,
  onSelectMonth,
}: CalendarCaptionProps) {
  const title = formatCalendarMonthYear(monthIso, system, format);
  if (layout === 'buttons') {
    return (
      <div
        id={id}
        aria-live="polite"
        className="text-h5 text-text-primary flex h-9 items-center justify-center"
      >
        {title}
      </div>
    );
  }

  const { year, month } = toCalendarDate(monthIso, system);
  const years = getCalendarYearRange(system, { around: monthIso, from: min, to: max, ...format });
  // ISO strings of equal width compare in date order, so < and > are exact here.
  const monthOptions = getCalendarMonthNames(system, format).map((entry) => {
    const start = calendarMonthStart(system, year, entry.month, monthIso);
    return {
      value: entry.month,
      label: entry.name,
      disabled:
        (min !== undefined && endOfCalendarMonth(start, system) < min) ||
        (max !== undefined && start > max),
    };
  });
  const yearOptions = years.map((entry) => ({ value: entry.year, label: entry.label }));

  return (
    <div className="flex h-9 items-center justify-center gap-1 px-9">
      <span id={id} aria-live="polite" className="sr-only">
        {title}
      </span>
      <CaptionSelect
        label={monthLabel}
        value={month}
        disabled={disabled}
        options={monthOptions}
        onChange={(next) => onSelectMonth(year, next)}
      />
      <CaptionSelect
        label={yearLabel}
        value={year}
        disabled={disabled}
        options={yearOptions}
        onChange={(next) => onSelectMonth(next, month)}
      />
    </div>
  );
}

export { CalendarCaption, CalendarNav };
export type { CalendarCaptionProps, CalendarNavProps, CaptionLayout };
