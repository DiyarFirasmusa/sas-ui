import { Field as FieldPrimitive } from '@base-ui/react/field';
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FocusEventHandler,
  type Ref,
} from 'react';
import {
  Calendar,
  type CalendarCommonProps,
  type CalendarLabelKey,
} from '@/components/ui/calendar';
import { CalendarIcon, CloseIcon } from '@/components/ui/icons';
import { controlClasses } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate, parseISODate, type DateStyle } from '@/lib/date-utils';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'placeholder' | 'clear' | 'chooseDate'> = {
  en: {
    placeholder: 'Select a date',
    clear: 'Clear date',
    chooseDate: 'Choose a date',
  },
  ar: {
    placeholder: 'اختر تاريخاً',
    clear: 'مسح التاريخ',
    chooseDate: 'اختيار التاريخ',
  },
};

type DatePickerLabelKey = keyof typeof messages.en;

/** Props every date-field trigger shares (single and range pickers). */
interface DateFieldProps {
  id?: string;
  name?: string;
  disabled?: boolean;
  /** Shows the value and lets the user focus, but not change it. */
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Classes for the trigger button. */
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

interface DatePickerTriggerProps extends DateFieldProps {
  /** Formatted value, or null to show the placeholder. */
  display: string | null;
  placeholder: string;
  clearLabel: string;
  /** Show a clear button while there is a value. */
  clearable?: boolean;
  onClear?: () => void;
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

interface TriggerButtonProps extends Omit<
  DatePickerTriggerProps,
  'id' | 'name' | 'ref' | 'clearable' | 'onClear' | 'clearLabel'
> {
  /** Leave room at the end for the clear button. */
  reserveClear: boolean;
  controlProps: ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement>;
  };
  forwardedRef?: Ref<HTMLButtonElement>;
  nodeRef: { current: HTMLButtonElement | null };
}

function TriggerButton({
  controlProps,
  forwardedRef,
  nodeRef,
  display,
  placeholder,
  reserveClear,
  invalid,
  required,
  readOnly,
  className,
  onBlur,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: TriggerButtonProps) {
  const valueId = useId();
  // Field.Control is an input primitive; its input-only props must not reach a button.
  // The hidden input carries the name, so the button must not claim it too.
  const {
    ref: controlRef,
    defaultValue,
    onChange,
    onBlur: controlBlur,
    ...withName
  } = controlProps;
  const { name: _fieldName, ...buttonProps } = withName;
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      nodeRef.current = node;
      assignRef(controlRef, node);
      assignRef(forwardedRef, node);
    },
    [controlRef, forwardedRef, nodeRef],
  );

  // Name = field label (or aria-label) followed by the current value, so a screen
  // reader says "Birth date, 16 November 2026" instead of just the label.
  const labelIds =
    ariaLabelledBy ?? buttonProps['aria-labelledby'] ?? (ariaLabel ? buttonProps.id : undefined);
  const hasValue = display !== null;

  return (
    <PopoverTrigger
      ref={setRef}
      {...buttonProps}
      aria-label={ariaLabel}
      aria-labelledby={labelIds ? `${labelIds} ${valueId}` : undefined}
      aria-describedby={ariaDescribedBy ?? buttonProps['aria-describedby']}
      aria-invalid={invalid || buttonProps['aria-invalid'] || undefined}
      aria-required={required || undefined}
      data-readonly={readOnly ? '' : undefined}
      onBlur={(event) => {
        controlBlur?.(event);
        onBlur?.(event);
      }}
      className={cn(
        controlClasses,
        'cursor-pointer justify-start data-[popup-open]:border-primary-highlight',
        'data-[readonly]:cursor-default',
        reserveClear && 'pe-10',
        className,
      )}
    >
      <CalendarIcon className="text-text-muted" />
      <span
        id={valueId}
        data-placeholder={hasValue ? undefined : ''}
        className="data-[placeholder]:text-text-muted min-w-0 flex-1 truncate text-start"
      >
        {display ?? placeholder}
      </span>
    </PopoverTrigger>
  );
}

/**
 * The shared look of the date pickers' trigger: a control-styled button inside
 * a Popover that shows the formatted value or a placeholder, plus an optional
 * clear button. It joins an enclosing `Field` (label, description, invalid)
 * through Base UI's Field.Control. Render it inside a `Popover`.
 */
function DatePickerTrigger({
  id,
  name,
  disabled,
  display,
  clearable,
  onClear,
  clearLabel,
  readOnly,
  ref,
  ...triggerProps
}: DatePickerTriggerProps) {
  const nodeRef = useRef<HTMLButtonElement | null>(null);
  const showClear = Boolean(clearable && display !== null && !readOnly && !disabled);
  return (
    <div data-slot="date-picker" className="relative w-full">
      <FieldPrimitive.Control
        id={id}
        name={name}
        disabled={disabled}
        render={(controlProps) => (
          <TriggerButton
            controlProps={controlProps}
            forwardedRef={ref}
            nodeRef={nodeRef}
            display={display}
            reserveClear={showClear}
            readOnly={readOnly}
            {...triggerProps}
          />
        )}
      />
      {showClear ? (
        <button
          type="button"
          data-slot="date-picker-clear"
          aria-label={clearLabel}
          onClick={() => {
            onClear?.();
            nodeRef.current?.focus();
          }}
          className={cn(
            'absolute end-1.5 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-text-muted outline-none',
            'hover:bg-hover-row hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}

type DatePickerCalendarProps = Pick<
  CalendarCommonProps,
  'min' | 'max' | 'isDateDisabled' | 'weekStartsOn' | 'numerals' | 'fixedWeeks' | 'defaultMonth'
>;

interface DatePickerProps extends DateFieldProps, DatePickerCalendarProps {
  /** ISO `yyyy-mm-dd`, or null for no date. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  /** Lets the user empty the field with a clear button. */
  clearable?: boolean;
  /** How the chosen date reads in the trigger. Default `long`. */
  dateStyle?: DateStyle;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels?: Partial<Record<DatePickerLabelKey | CalendarLabelKey, string>>;
}

/**
 * Date field: a trigger showing the formatted date and a calendar in a popover.
 * The value is an ISO `yyyy-mm-dd` string (local day, no timezone shift), which
 * is also what a `name`d hidden input submits. Closes on selection, Esc, or
 * outside click, returning focus to the trigger.
 */
function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  clearable = false,
  dateStyle = 'long',
  open,
  defaultOpen = false,
  onOpenChange,
  labels: labelOverrides,
  name,
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  numerals = 'latn',
  fixedWeeks,
  defaultMonth,
  ...fieldProps
}: DatePickerProps) {
  const { locale } = useLocale();
  const labels = useLabels(messages, labelOverrides);
  const [innerValue, setInnerValue] = useState<string | null>(defaultValue);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const current = value === undefined ? innerValue : value;
  const isOpen = open ?? innerOpen;
  const selected = parseISODate(current);
  const { disabled, readOnly } = fieldProps;
  const calendarRef = useRef<HTMLDivElement>(null);

  function commit(next: string | null) {
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

  return (
    <Popover open={isOpen && !disabled} onOpenChange={changeOpen}>
      <DatePickerTrigger
        {...fieldProps}
        display={selected ? formatDate(selected, { locale, numerals, dateStyle }) : null}
        placeholder={placeholder ?? labels.placeholder}
        clearable={clearable}
        clearLabel={labels.clear}
        onClear={() => commit(null)}
      />
      {name ? <input type="hidden" name={name} value={current ?? ''} /> : null}
      <PopoverContent
        align="start"
        aria-label={labels.chooseDate}
        className="w-auto"
        initialFocus={() =>
          calendarRef.current?.querySelector<HTMLElement>('[data-date][tabindex="0"]') ?? true
        }
      >
        <Calendar
          ref={calendarRef}
          mode="single"
          value={current}
          defaultMonth={defaultMonth}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          weekStartsOn={weekStartsOn}
          numerals={numerals}
          fixedWeeks={fixedWeeks}
          labels={labelOverrides}
          onValueChange={(next) => {
            commit(next);
            changeOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, DatePickerTrigger };
export type { DateFieldProps, DatePickerLabelKey, DatePickerProps, DatePickerTriggerProps };
