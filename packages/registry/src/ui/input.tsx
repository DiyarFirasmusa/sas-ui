import { Input as InputPrimitive } from '@base-ui/react/input';
import { useState, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared look of every single-line control (input, select trigger, date…),
 * translated from the dashboards' `.control` sheet: `h-control-input` (42px in
 * the compact system, 44px in the comfortable one), `rounded-control`, a 1px
 * `stroke` border, 16px inline padding, `text-control-input` (400 13/19.5), a
 * 4% ink wash over the surface and a muted placeholder. Hover darkens the
 * stroke, focus (also `focus-within`, for wrappers) draws the highlight border
 * plus a 3px 20% glow, invalid swaps both to danger, disabled greys the fill.
 */
export const controlClasses = [
  'flex h-control-input w-full min-w-0 items-center gap-field rounded-control border border-stroke px-row',
  'bg-[color-mix(in_oklab,var(--text-primary)_4%,var(--surface))] text-control-input text-text-primary',
  'transition-[border-color,box-shadow] duration-150 ease-[ease] motion-reduce:transition-none',
  'placeholder:text-text-muted',
  'not-disabled:not-aria-invalid:not-data-invalid:hover:border-stroke-strong',
  'outline-none focus-within:border-primary-highlight focus-within:ring-3 focus-within:ring-primary-highlight/20',
  'aria-invalid:border-danger aria-invalid:focus-within:border-danger aria-invalid:focus-within:ring-danger/20',
  'data-[invalid]:border-danger data-[invalid]:focus-within:border-danger data-[invalid]:focus-within:ring-danger/20',
  'disabled:cursor-not-allowed disabled:bg-disabled-container disabled:text-text-inactive',
  'data-[disabled]:cursor-not-allowed data-[disabled]:bg-disabled-container data-[disabled]:text-text-inactive',
].join(' ');

/**
 * Opt-in control heights. `default` is the input height of the active preset;
 * `sm` sits 2px under it (the dashboards' 40px compact trigger for toolbars and
 * table cells); `lg` is the large button height (44px compact, 52px comfortable).
 */
export const controlSizeClasses = {
  default: '',
  sm: 'h-[calc(var(--control-h-input,42px)-2px)]',
  lg: 'h-control-lg',
} as const;

/**
 * One row of a dropdown list (select, combobox, multi-select), from the
 * dashboards' `.select-item`: 40px minimum, 13px text, 8px radius, hover and
 * keyboard highlight on `hover-row`, the selected row on `primary-light`, and
 * room at the end edge for the check mark (position it with `end-2`).
 */
export const optionClasses = [
  'relative flex min-h-10 w-full cursor-default items-center gap-field rounded-md py-2 ps-2 pe-8 text-start text-b2 text-text-primary outline-none select-none',
  'hover:bg-hover-row focus-visible:bg-hover-row data-[highlighted]:bg-hover-row',
  'data-[selected]:bg-primary-light data-[selected]:hover:bg-primary-light data-[selected]:data-[highlighted]:bg-primary-light',
  'data-[disabled]:pointer-events-none data-[disabled]:text-text-muted data-[disabled]:opacity-60',
].join(' ');

type ControlSize = keyof typeof controlSizeClasses;

type InputProps = Omit<React.ComponentProps<'input'>, 'dir' | 'size'> & {
  /** `sm` is 2px shorter than the preset's input height, `lg` is as tall as a large button. */
  size?: ControlSize;
  /**
   * Switch to `dir="auto"` once the field has a value so the typed language
   * decides (default). Pass `false` to keep the UI direction at all times.
   */
  autoDirection?: boolean;
  /**
   * `text` follows what the user types (Arabic right-to-left, English
   * left-to-right). `latin` is for emails, codes, phone numbers and URLs: the
   * value is always left-to-right while the placeholder keeps the UI direction.
   */
  kind?: 'text' | 'latin';
};

/**
 * Text input. An empty free-text field uses the UI direction (browsers would
 * otherwise left-align an Arabic placeholder); once it has a value it switches
 * to `dir="auto"` so the typed language decides.
 */
function Input({
  className,
  kind = 'text',
  size = 'default',
  autoDirection = true,
  type = 'text',
  value,
  defaultValue,
  onChange,
  ...props
}: InputProps) {
  const [typedValue, setTypedValue] = useState(String(defaultValue ?? ''));
  const current = value === undefined ? typedValue : String(value);
  const isLatin = kind === 'latin' || type === 'email' || type === 'url' || type === 'tel';

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setTypedValue(event.target.value);
    onChange?.(event);
  }

  const direction = isLatin ? 'ltr' : current === '' || !autoDirection ? undefined : 'auto';

  return (
    <InputPrimitive
      data-slot="input"
      data-size={size}
      type={type}
      dir={direction}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      className={cn(
        controlClasses,
        controlSizeClasses[size],
        'file:me-inline file:border-0 file:bg-transparent file:text-b2 file:font-medium',
        isLatin && 'rtl:placeholder-shown:[direction:rtl] rtl:placeholder-shown:text-end',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
