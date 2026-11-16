import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import type { FocusEventHandler, Ref } from 'react';
import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { controlClasses } from '@/components/ui/input';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'increase' | 'decrease' | 'roleDescription'> = {
  en: {
    increase: 'Increase',
    decrease: 'Decrease',
    roleDescription: 'Number field',
  },
  ar: { increase: 'زيادة', decrease: 'إنقاص', roleDescription: 'حقل رقمي' },
};

interface NumberInputProps extends Omit<
  NumberFieldPrimitive.Root.Props,
  'ref' | 'children' | 'locale' | 'onBlur' | 'onFocus' | 'render' | 'inputRef' | 'aria-label'
> {
  /** Reaches the text input, so react-hook-form can focus it on error. */
  ref?: Ref<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  /** Accessible name when there is no surrounding `Field` label. */
  'aria-label'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Show the −/+ buttons. Default true. */
  showSteppers?: boolean;
  /** Overrides for the stepper buttons' accessible names and the role description. */
  labels?: Partial<Record<'increase' | 'decrease' | 'roleDescription', string>>;
}

/**
 * Number field with stepper buttons, Arrow/Page/Home/End keys and min/max
 * clamping. The value is always shown with Latin digits, left-to-right and
 * tabular, whatever the UI language, at the start edge of the control; the two
 * 28px stepper buttons sit together at the end edge (the dashboards' number
 * stepper), decrease first.
 */
function NumberInput({
  className,
  ref,
  onBlur,
  placeholder,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  showSteppers = true,
  labels: labelOverrides,
  ...props
}: NumberInputProps) {
  const labels = useLabels(messages, labelOverrides);
  const stepper = cn(
    'inline-flex size-7 shrink-0 items-center justify-center rounded-control text-text-secondary outline-none',
    'transition-colors duration-150 hover:bg-hover-row hover:text-text-primary focus-visible:bg-hover-row focus-visible:text-text-primary',
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
    '[&_svg]:size-4',
  );
  return (
    <NumberFieldPrimitive.Root data-slot="number-input" locale="en-US" {...props}>
      <NumberFieldPrimitive.Group
        data-slot="number-input-group"
        className={cn(
          controlClasses,
          'gap-0.5',
          showSteppers && 'pe-1.5',
          // The invalid flag sits on the inner input, so the group reads it with :has().
          'has-[input[aria-invalid=true]]:border-danger has-[input[aria-invalid=true]]:focus-within:border-danger has-[input[aria-invalid=true]]:focus-within:ring-danger/20',
          className,
        )}
      >
        <NumberFieldPrimitive.Input
          ref={ref}
          dir="ltr"
          onBlur={onBlur}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-roledescription={labels.roleDescription}
          data-slot="number-input-field"
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent text-start text-control-input text-text-primary tabular-nums outline-none rtl:text-end',
            'placeholder:text-text-muted disabled:cursor-not-allowed',
          )}
        />
        {showSteppers ? (
          <NumberFieldPrimitive.Decrement
            data-slot="number-input-decrement"
            aria-label={labels.decrease}
            className={stepper}
          >
            <MinusIcon />
          </NumberFieldPrimitive.Decrement>
        ) : null}
        {showSteppers ? (
          <NumberFieldPrimitive.Increment
            data-slot="number-input-increment"
            aria-label={labels.increase}
            className={stepper}
          >
            <PlusIcon />
          </NumberFieldPrimitive.Increment>
        ) : null}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}

export { NumberInput };
export type { NumberInputProps };
