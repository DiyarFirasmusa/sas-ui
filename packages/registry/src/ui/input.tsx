import { Input as InputPrimitive } from '@base-ui/react/input';
import { useState, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

/** Shared look of every single-line control (input, select trigger, date…). */
export const controlClasses = [
  'flex h-9.5 w-full min-w-0 items-center gap-field rounded-control border border-stroke-strong bg-surface px-inline',
  'text-b1 text-text-primary placeholder:text-text-muted',
  'transition-colors outline-none',
  'hover:border-neutral-500',
  'focus-visible:border-primary-highlight focus-visible:ring-2 focus-visible:ring-ring/40',
  'disabled:cursor-not-allowed disabled:bg-disabled-container disabled:text-text-inactive',
  'aria-invalid:border-danger aria-invalid:ring-danger/30',
  'data-[invalid]:border-danger',
].join(' ');

/** Opt-in control heights. `lg` is 42px; `default` keeps the 38px of `controlClasses`. */
export const controlSizeClasses = {
  default: '',
  lg: 'h-10.5',
} as const;

type ControlSize = keyof typeof controlSizeClasses;

type InputProps = Omit<React.ComponentProps<'input'>, 'dir' | 'size'> & {
  /** `lg` makes the control 42px tall; the default is unchanged. */
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
