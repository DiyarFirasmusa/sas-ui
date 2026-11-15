import { Field as FieldPrimitive } from '@base-ui/react/field';
import {
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FocusEventHandler,
  type HTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { ClockIcon } from '@/components/ui/icons';
import { controlClasses } from '@/components/ui/input';
import {
  formatTime,
  getDayPeriodLabels,
  parseTime,
  stepToMultiple,
  stepWithin,
  to12Hour,
  to24Hour,
  type DayPeriod,
} from '@/lib/date-utils';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'hour' | 'minute' | 'period' | 'empty'> = {
  en: { hour: 'Hour', minute: 'Minute', period: 'AM/PM', empty: 'Empty' },
  ar: { hour: 'الساعة', minute: 'الدقيقة', period: 'ص/م', empty: 'فارغ' },
};

type TimePickerLabelKey = keyof typeof messages.en;
type Segment = 'hour' | 'minute' | 'period';

interface Parts {
  /** As displayed: 0-23 on a 24h clock, 1-12 on a 12h clock. */
  hour: number | null;
  minute: number | null;
  period: DayPeriod;
}

type HourCycle = 12 | 24;

const EMPTY_PARTS: Parts = { hour: null, minute: null, period: 'am' };

function partsFromValue(value: string | null | undefined, cycle: HourCycle): Parts {
  const time = parseTime(value);
  if (!time) {
    return EMPTY_PARTS;
  }
  if (cycle === 24) {
    return {
      hour: time.hour,
      minute: time.minute,
      period: time.hour >= 12 ? 'pm' : 'am',
    };
  }
  const { hour, period } = to12Hour(time.hour);
  return { hour, minute: time.minute, period };
}

/** `HH:mm` once both hour and minute are set; a half-typed time has no value yet. */
function valueFromParts({ hour, minute, period }: Parts, cycle: HourCycle): string | null {
  if (hour === null || minute === null) {
    return null;
  }
  return formatTime({
    hour: cycle === 12 ? to24Hour(hour, period) : hour,
    minute,
  });
}

function pad(value: number | null): string {
  return value === null ? '' : String(value).padStart(2, '0');
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

const segmentClasses = cn(
  'h-7 w-7 rounded-sm bg-transparent text-center text-b1 text-text-primary tabular-nums outline-none',
  'caret-transparent placeholder:text-text-muted',
  'focus:bg-primary-light focus:text-primary-text',
  'disabled:cursor-not-allowed',
);

interface TimePickerProps {
  /** `HH:mm` (24h clock, always), or null while empty or half-typed. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** How the clock is displayed. The value is `HH:mm` either way. Default 24. */
  hourCycle?: HourCycle;
  /** Minutes jump by this many with the arrow keys (5, 10, 15, 30…). Default 1. */
  minuteStep?: number;
  id?: string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** Fires when focus leaves the whole control, not between its segments. */
  onBlur?: FocusEventHandler<HTMLDivElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
  /** Points at the hour segment, the first focusable part. */
  ref?: Ref<HTMLInputElement>;
  labels?: Partial<Record<TimePickerLabelKey, string>>;
}

type ControlProps = HTMLAttributes<HTMLDivElement> & {
  name?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Time field made of keyboard-first segments (hour, minute, optional AM/PM),
 * like a native time input but with a consistent look and Arabic labels. Each
 * segment is an ARIA spinbutton: Up/Down step it, Page keys step further,
 * Home/End jump to the limits, digits type into it and advance, Backspace
 * clears. Digits are Latin and the control is always left-to-right (a clock
 * reads the same in both languages).
 */
function TimePicker({
  value,
  defaultValue = null,
  onValueChange,
  hourCycle = 24,
  minuteStep = 1,
  id,
  name,
  disabled = false,
  readOnly = false,
  required,
  invalid,
  onBlur,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
  ref,
  labels: labelOverrides,
}: TimePickerProps) {
  const { locale } = useLocale();
  const labels = useLabels(messages, labelOverrides);
  const periodLabels = getDayPeriodLabels({ locale });
  const [parts, setParts] = useState<Parts>(() =>
    partsFromValue(value === undefined ? defaultValue : value, hourCycle),
  );
  const buffer = useRef('');
  const refs = useRef<Record<Segment, HTMLInputElement | null>>({
    hour: null,
    minute: null,
    period: null,
  });

  const current = valueFromParts(parts, hourCycle);
  // A controlled value that disagrees with what is shown wins (e.g. the parent
  // rejected a change or reset the form). A half-typed time maps to null, so
  // it is left alone while the parent still says null.
  if (value !== undefined && (value || null) !== current) {
    setParts(partsFromValue(value, hourCycle));
  }

  const segments: Segment[] = hourCycle === 12 ? ['hour', 'minute', 'period'] : ['hour', 'minute'];
  const hourMin = hourCycle === 12 ? 1 : 0;
  const hourMax = hourCycle === 12 ? 12 : 23;

  function update(next: Parts) {
    setParts(next);
    const nextValue = valueFromParts(next, hourCycle);
    if (nextValue !== current) {
      onValueChange?.(nextValue);
    }
  }

  function focusNeighbour(segment: Segment, offset: number) {
    const target = segments[segments.indexOf(segment) + offset];
    if (target) {
      refs.current[target]?.focus();
    }
  }

  function setSegment(segment: Segment, next: number | null) {
    if (segment === 'hour') {
      update({ ...parts, hour: next });
    } else if (segment === 'minute') {
      update({ ...parts, minute: next });
    }
  }

  function step(segment: Segment, direction: 1 | -1, large: boolean) {
    buffer.current = '';
    if (segment === 'period') {
      update({ ...parts, period: parts.period === 'am' ? 'pm' : 'am' });
    } else if (segment === 'hour') {
      const delta = direction * (large ? 3 : 1);
      const next =
        parts.hour === null
          ? direction > 0
            ? hourMin
            : hourMax
          : stepWithin(parts.hour, delta, hourMin, hourMax);
      setSegment('hour', next);
    } else {
      // From empty, -1 / 60 make the first step land on the first / last grid value.
      let next = parts.minute ?? (direction > 0 ? -1 : 60);
      const count = large ? Math.ceil(10 / minuteStep) : 1;
      for (let index = 0; index < count; index += 1) {
        next = stepToMultiple(next, direction, minuteStep);
      }
      setSegment('minute', next);
    }
  }

  function typeDigit(segment: Segment, digit: string) {
    const max = segment === 'hour' ? hourMax : 59;
    const min = segment === 'hour' ? hourMin : 0;
    let text = buffer.current + digit;
    if (Number(text) > max) {
      text = digit;
    }
    const typed = Number(text);
    if (typed < min) {
      // A leading 0 on a 1-12 hour: wait for the second digit.
      buffer.current = text;
      return;
    }
    setSegment(segment, typed);
    if (text.length === 2 || typed * 10 > max) {
      buffer.current = '';
      focusNeighbour(segment, 1);
    } else {
      buffer.current = text;
    }
  }

  function typePeriod(key: string) {
    const typed = key.toLowerCase();
    if (periodLabels.am.toLowerCase().startsWith(typed)) {
      update({ ...parts, period: 'am' });
    } else if (periodLabels.pm.toLowerCase().startsWith(typed)) {
      update({ ...parts, period: 'pm' });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, segment: Segment) {
    if (event.altKey || event.ctrlKey || event.metaKey || disabled) {
      return;
    }
    const { key } = event;
    const handled = [
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown',
      'Home',
      'End',
      'Backspace',
      'Delete',
    ];
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      buffer.current = '';
      focusNeighbour(segment, key === 'ArrowRight' ? 1 : -1);
      return;
    }
    if (readOnly || key === 'Tab') {
      return;
    }
    if (handled.includes(key) || /^\d$/.test(key) || key.length === 1) {
      event.preventDefault();
    }
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'PageUp' || key === 'PageDown') {
      step(segment, key === 'ArrowUp' || key === 'PageUp' ? 1 : -1, key.startsWith('Page'));
    } else if (key === 'Home' || key === 'End') {
      buffer.current = '';
      if (segment === 'period') {
        update({ ...parts, period: key === 'Home' ? 'am' : 'pm' });
      } else if (segment === 'hour') {
        setSegment('hour', key === 'Home' ? hourMin : hourMax);
      } else {
        setSegment('minute', key === 'Home' ? 0 : stepToMultiple(0, -1, minuteStep));
      }
    } else if (key === 'Backspace' || key === 'Delete') {
      buffer.current = '';
      if (segment !== 'period') {
        setSegment(segment, null);
      }
    } else if (segment === 'period') {
      if (key.length === 1) {
        typePeriod(key);
      }
    } else if (/^\d$/.test(key)) {
      typeDigit(segment, key);
    }
  }

  // Mobile keyboards often report key "Unidentified"; their text arrives here.
  function handleChange(event: ChangeEvent<HTMLInputElement>, segment: Segment) {
    if (readOnly || segment === 'period') {
      return;
    }
    const typed = event.target.value.replace(/\D/g, '').slice(-1);
    if (typed) {
      typeDigit(segment, typed);
    }
  }

  function segmentProps(segment: Segment) {
    const isPeriod = segment === 'period';
    const number = segment === 'hour' ? parts.hour : parts.minute;
    const min = isPeriod ? 0 : segment === 'hour' ? hourMin : 0;
    const max = isPeriod ? 1 : segment === 'hour' ? hourMax : 59;
    const display = isPeriod ? periodLabels[parts.period] : pad(number);
    return {
      ref: (node: HTMLInputElement | null) => {
        refs.current[segment] = node;
        if (segment === 'hour') {
          assignRef(ref, node);
        }
      },
      role: 'spinbutton' as const,
      type: 'text' as const,
      inputMode: isPeriod ? ('text' as const) : ('numeric' as const),
      autoComplete: 'off',
      value: display,
      placeholder: isPeriod ? undefined : '––',
      disabled,
      readOnly,
      'aria-label': labels[segment],
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': isPeriod ? (parts.period === 'am' ? 0 : 1) : (number ?? undefined),
      'aria-valuetext': display === '' ? labels.empty : display,
      'aria-invalid': invalid || undefined,
      'aria-required': required || undefined,
      onChange: (event: ChangeEvent<HTMLInputElement>) => handleChange(event, segment),
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => handleKeyDown(event, segment),
      onFocus: (event: FocusEvent<HTMLInputElement>) => {
        buffer.current = '';
        event.currentTarget.select();
      },
      className: cn(segmentClasses, isPeriod && 'w-10'),
    };
  }

  const renderGroup = (controlProps: ControlProps) => {
    const {
      ref: controlRef,
      defaultValue: _default,
      onChange: _change,
      onKeyDown: _key,
      onBlur: controlBlur,
      name: _name,
      ...groupProps
    } = controlProps;
    const labelledBy = ariaLabelledBy ?? groupProps['aria-labelledby'];
    return (
      <div
        ref={controlRef}
        role="group"
        dir="ltr"
        data-slot="time-picker"
        {...groupProps}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={ariaDescribedBy ?? groupProps['aria-describedby']}
        aria-invalid={invalid || groupProps['aria-invalid'] || undefined}
        aria-disabled={disabled || undefined}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            buffer.current = '';
            controlBlur?.(event);
            onBlur?.(event);
          }
        }}
        className={cn(
          controlClasses,
          'w-fit gap-0.5 focus-within:border-primary-highlight focus-within:ring-2 focus-within:ring-ring/40',
          disabled && 'cursor-not-allowed bg-disabled-container text-text-inactive',
          className,
        )}
      >
        <ClockIcon className="text-text-muted me-1" />
        <input {...segmentProps('hour')} />
        <span aria-hidden="true" className="text-text-muted">
          :
        </span>
        <input {...segmentProps('minute')} />
        {hourCycle === 12 ? <input {...segmentProps('period')} /> : null}
        {name ? <input type="hidden" name={name} value={current ?? ''} /> : null}
      </div>
    );
  };

  return <FieldPrimitive.Control id={id} disabled={disabled} render={renderGroup} />;
}

export { TimePicker };
export type { HourCycle, TimePickerLabelKey, TimePickerProps };
