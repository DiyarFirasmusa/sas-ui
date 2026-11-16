import { useRef, useState, useSyncExternalStore, type Ref } from 'react';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  type CalendarCommonProps,
  type CalendarLabelKey,
  type DateRangeValue,
} from '@/components/ui/calendar';
import {
  DatePickerTrigger,
  type DateFieldProps,
  type DatePickerLabelKey,
} from '@/components/ui/date-picker';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { formatCalendarDate, formatCalendarDateRange } from '@/lib/calendar-systems';
import { parseISODate, type DateStyle } from '@/lib/date-utils';
import { useLabels, useLocale, type Messages } from '@/lib/locale';

const messages: Messages<'placeholder' | 'clear' | 'chooseRange' | 'presets'> = {
  en: {
    placeholder: 'Select a date range',
    clear: 'Clear dates',
    chooseRange: 'Choose a date range',
    presets: 'Quick ranges',
  },
  ar: {
    placeholder: 'اختر فترة زمنية',
    clear: 'مسح التواريخ',
    chooseRange: 'اختيار فترة زمنية',
    presets: 'فترات سريعة',
  },
};

type DateRangePickerLabelKey = keyof typeof messages.en;

interface DateRangePreset {
  label: string;
  value: { from: string; to: string };
}

const EMPTY_RANGE: DateRangeValue = { from: null, to: null };
// Tailwind's `sm` breakpoint: below it a second month would not fit.
const WIDE_QUERY = '(min-width: 640px)';

function useWideScreen(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(WIDE_QUERY);
      query.addEventListener('change', notify);
      return () => query.removeEventListener('change', notify);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
}

type DateRangeCalendarProps = Pick<
  CalendarCommonProps,
  | 'min'
  | 'max'
  | 'isDateDisabled'
  | 'weekStartsOn'
  | 'numerals'
  | 'fixedWeeks'
  | 'defaultMonth'
  | 'calendarSystem'
  | 'secondaryCalendar'
  | 'captionLayout'
>;

interface DateRangePickerProps extends Omit<DateFieldProps, 'name'>, DateRangeCalendarProps {
  /** `{ from, to }` as ISO `yyyy-mm-dd` strings; both null when empty. */
  value?: DateRangeValue | null;
  defaultValue?: DateRangeValue | null;
  /** Fires once a complete range is chosen (or with both ends null when cleared). */
  onValueChange?: (value: DateRangeValue) => void;
  placeholder?: string;
  clearable?: boolean;
  dateStyle?: DateStyle;
  /** Two months side by side when the screen is wide enough. Default 2. */
  numberOfMonths?: 1 | 2;
  /** One-click ranges shown beside the calendar ("Last 7 days"…). */
  presets?: readonly DateRangePreset[];
  /** Base name for the two hidden inputs `<name>-from` and `<name>-to`. */
  name?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels?: Partial<Record<DateRangePickerLabelKey | DatePickerLabelKey | CalendarLabelKey, string>>;
}

interface PanelProps extends DateRangeCalendarProps {
  ref?: Ref<HTMLDivElement>;
  initial: DateRangeValue;
  months: 1 | 2;
  presets?: readonly DateRangePreset[];
  presetsLabel: string;
  labels: DateRangePickerProps['labels'];
  onComplete: (range: DateRangeValue) => void;
}

/**
 * The popup body. It holds the half-finished range (start picked, end not yet)
 * itself and is unmounted on close, so each opening starts from the saved value.
 */
function DateRangePanel({
  ref,
  initial,
  months,
  presets,
  presetsLabel,
  labels,
  onComplete,
  defaultMonth,
  ...calendarProps
}: PanelProps) {
  const [draft, setDraft] = useState<DateRangeValue>(initial);
  return (
    <div ref={ref} className="gap-row flex flex-col sm:flex-row">
      {presets && presets.length > 0 ? (
        <div
          role="group"
          aria-label={presetsLabel}
          className="flex flex-row flex-wrap gap-1 sm:min-w-32 sm:flex-col sm:flex-nowrap"
        >
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => onComplete(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}
      <Calendar
        mode="range"
        value={draft}
        numberOfMonths={months}
        defaultMonth={defaultMonth}
        labels={labels}
        onValueChange={(next) => {
          setDraft(next);
          if (next.from && next.to) {
            onComplete(next);
          }
        }}
        {...calendarProps}
      />
    </div>
  );
}

/**
 * Date-range field: a trigger showing "from – to" and a range calendar in a
 * popover (two months side by side on wide screens). The popover closes once
 * the end date is chosen. Values are ISO strings, so ranges carry no timezone.
 */
function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  clearable = false,
  dateStyle = 'long',
  numberOfMonths = 2,
  presets,
  name,
  open,
  defaultOpen = false,
  onOpenChange,
  labels: labelOverrides,
  defaultMonth,
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  numerals = 'latn',
  calendarSystem = 'gregory',
  secondaryCalendar,
  captionLayout,
  fixedWeeks,
  ...fieldProps
}: DateRangePickerProps) {
  const { locale } = useLocale();
  const labels = useLabels(messages, labelOverrides);
  const wide = useWideScreen();
  const [innerValue, setInnerValue] = useState<DateRangeValue | null>(defaultValue);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const current = (value === undefined ? innerValue : value) ?? EMPTY_RANGE;
  const isOpen = open ?? innerOpen;
  const from = parseISODate(current.from);
  const to = parseISODate(current.to);
  const { disabled, readOnly } = fieldProps;
  const panelRef = useRef<HTMLDivElement>(null);

  function commit(next: DateRangeValue) {
    setInnerValue(next);
    onValueChange?.(next);
  }

  function changeOpen(next: boolean) {
    if (readOnly && next) {
      return;
    }
    setInnerOpen(next);
    onOpenChange?.(next);
  }

  const format = { locale, numerals };
  let display: string | null = null;
  if (current.from && current.to && from && to) {
    display = formatCalendarDateRange(current.from, current.to, calendarSystem, {
      ...format,
      dateStyle,
    });
  } else if (current.from && from) {
    display = `${formatCalendarDate(current.from, calendarSystem, { ...format, dateStyle })} –`;
  }

  return (
    <Popover open={isOpen && !disabled} onOpenChange={changeOpen}>
      <DatePickerTrigger
        {...fieldProps}
        display={display}
        placeholder={placeholder ?? labels.placeholder}
        clearable={clearable}
        clearLabel={labels.clear}
        onClear={() => commit(EMPTY_RANGE)}
      />
      {name ? (
        <>
          <input type="hidden" name={`${name}-from`} value={current.from ?? ''} />
          <input type="hidden" name={`${name}-to`} value={current.to ?? ''} />
        </>
      ) : null}
      <PopoverContent
        align="start"
        aria-label={labels.chooseRange}
        className="w-auto"
        initialFocus={() =>
          panelRef.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]') ?? true
        }
      >
        <DateRangePanel
          ref={panelRef}
          initial={current}
          months={wide ? numberOfMonths : 1}
          presets={presets}
          presetsLabel={labels.presets}
          labels={labelOverrides}
          defaultMonth={defaultMonth}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          weekStartsOn={weekStartsOn}
          numerals={numerals}
          calendarSystem={calendarSystem}
          secondaryCalendar={secondaryCalendar}
          captionLayout={captionLayout}
          fixedWeeks={fixedWeeks}
          onComplete={(range) => {
            commit(range);
            changeOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DateRangePicker };
export type { DateRangePickerLabelKey, DateRangePickerProps, DateRangePreset };
