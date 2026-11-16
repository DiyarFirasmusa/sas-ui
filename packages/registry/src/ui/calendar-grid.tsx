import type { Selection } from '@/hooks/use-calendar-selection';
import {
  formatCalendarDateLong,
  formatCalendarDay,
  getCalendarMonthGrid,
  type CalendarSystem,
} from '@/lib/calendar-systems';
import {
  parseISODate,
  type DateFormatOptions,
  type WeekStart,
  type WeekdayName,
} from '@/lib/date-utils';
import { cn } from '@/lib/utils';

const dayClasses = cn(
  'relative flex size-10 flex-col items-center justify-center rounded-md text-b2 tabular-nums sm:size-9',
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

// A second number under the day needs a taller cell; the width stays the same.
const secondaryDayClasses = 'h-12 sm:h-11';

interface CalendarGridProps {
  /** Any ISO day inside the month to draw. */
  monthIso: string;
  /** Id of the element that names the grid (the month caption). */
  captionId: string;
  system: CalendarSystem;
  /** Small second day number under each day, in another calendar. */
  secondary: CalendarSystem | null;
  format: DateFormatOptions;
  weekStartsOn: WeekStart;
  weekdays: readonly WeekdayName[];
  fixedWeeks: boolean;
  selection: Selection;
  todayIso: string;
  /** The one day in the tab order. */
  tabbableIso: string;
  readOnly: boolean;
  disabled: boolean;
  isUnavailable: (date: Date) => boolean;
  onChoose: (date: Date) => void;
  onFocusDay: (date: Date) => void;
}

/**
 * One month as an ARIA grid. Days outside the month stay empty cells. Day
 * numbers and names come from `system`; every `data-date` stays Gregorian ISO
 * so keyboard handling and form values never depend on the calendar shown.
 */
function CalendarGrid({
  monthIso,
  captionId,
  system,
  secondary,
  format,
  weekStartsOn,
  weekdays,
  fixedWeeks,
  selection,
  todayIso,
  tabbableIso,
  readOnly,
  disabled,
  isUnavailable,
  onChoose,
  onFocusDay,
}: CalendarGridProps) {
  const secondarySystem = secondary && secondary !== system ? secondary : null;
  return (
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
              className="text-b3 text-text-muted size-10 p-0 text-center sm:size-9"
            >
              {weekday.narrow}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {getCalendarMonthGrid(monthIso, system, weekStartsOn, fixedWeeks).map((week, weekIndex) => (
          <tr key={`${monthIso}-${weekIndex}`}>
            {week.map((iso, dayIndex) => {
              const day = iso ? parseISODate(iso) : null;
              if (!iso || !day) {
                return <td key={`${monthIso}-${weekIndex}-${dayIndex}`} className="p-0" />;
              }
              const state = selection.stateOf(day);
              const unavailable = isUnavailable(day);
              const label = secondarySystem
                ? `${formatCalendarDateLong(iso, system, format)} (${formatCalendarDateLong(iso, secondarySystem, format)})`
                : formatCalendarDateLong(iso, system, format);
              return (
                <td key={iso} aria-selected={state.selected} className="p-0 text-center">
                  <button
                    type="button"
                    data-date={iso}
                    data-today={iso === todayIso ? '' : undefined}
                    data-selected={state.selected ? '' : undefined}
                    data-range-start={state.rangeStart ? '' : undefined}
                    data-range-end={state.rangeEnd ? '' : undefined}
                    data-range-middle={state.rangeMiddle ? '' : undefined}
                    aria-label={label}
                    aria-current={iso === todayIso ? 'date' : undefined}
                    aria-disabled={unavailable || undefined}
                    tabIndex={iso === tabbableIso ? 0 : -1}
                    onClick={() => onChoose(day)}
                    onFocus={() => onFocusDay(day)}
                    className={cn(dayClasses, secondarySystem && secondaryDayClasses)}
                  >
                    {formatCalendarDay(iso, system, format)}
                    {secondarySystem ? (
                      <span
                        data-slot="calendar-secondary-day"
                        aria-hidden="true"
                        className="text-b3 opacity-70"
                      >
                        {formatCalendarDay(iso, secondarySystem, format)}
                      </span>
                    ) : null}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export { CalendarGrid };
export type { CalendarGridProps };
