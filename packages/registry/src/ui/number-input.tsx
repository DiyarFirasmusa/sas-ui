import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';
import type { FocusEventHandler, Ref } from 'react';
import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { controlClasses } from '@/components/ui/input';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'increase' | 'decrease' | 'roleDescription'> = {
  en: { increase: 'Increase', decrease: 'Decrease', roleDescription: 'Number field' },
  ar: { increase: 'زيادة', decrease: 'إنقاص', roleDescription: 'حقل رقمي' },
};

interface NumberInputProps
  extends Omit<
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
 * tabular, whatever the UI language; the stepper buttons follow the UI
 * direction (decrease at the start edge).
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
    'inline-flex min-w-11 shrink-0 items-center justify-center self-stretch text-text-secondary outline-none sm:min-w-9.5',
    'transition-colors hover:bg-hover-row focus-visible:bg-hover-row focus-visible:text-text-primary',
    'disabled:cursor-not-allowed disabled:text-text-inactive disabled:hover:bg-transparent',
    '[&_svg]:size-4',
  );
  return (
    <NumberFieldPrimitive.Root data-slot="number-input" locale="en-US" {...props}>
      <NumberFieldPrimitive.Group
        data-slot="number-input-group"
        className={cn(
          controlClasses,
          'gap-0 overflow-hidden px-0',
          'focus-within:border-primary-highlight focus-within:ring-2 focus-within:ring-ring/40',
          'has-[input[aria-invalid=true]]:border-danger has-[input[aria-invalid=true]]:ring-danger/30',
          'data-[disabled]:cursor-not-allowed data-[disabled]:bg-disabled-container data-[disabled]:text-text-inactive',
          className,
        )}
      >
        {showSteppers ? (
          <NumberFieldPrimitive.Decrement
            data-slot="number-input-decrement"
            aria-label={labels.decrease}
            className={cn(stepper, 'border-e border-stroke')}
          >
            <MinusIcon />
          </NumberFieldPrimitive.Decrement>
        ) : null}
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
            'h-full min-w-0 flex-1 bg-transparent px-inline text-center text-b1 text-text-primary tabular-nums outline-none',
            'placeholder:text-text-muted disabled:cursor-not-allowed',
          )}
        />
        {showSteppers ? (
          <NumberFieldPrimitive.Increment
            data-slot="number-input-increment"
            aria-label={labels.increase}
            className={cn(stepper, 'border-s border-stroke')}
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
