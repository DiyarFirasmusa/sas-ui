import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { useId, type ReactNode } from 'react';
import { useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface RadioGroupProps extends RadioGroupPrimitive.Props<string> {
  /** Lay the options out in a column (default) or a wrapping row. */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Single-choice group. Put it inside `Field` so the field label names the
 * group and the error marks every option invalid. Arrow keys move the choice
 * and follow the reading direction (Left/Right swap in Arabic).
 */
function RadioGroup({ className, orientation = 'vertical', ...props }: RadioGroupProps) {
  const { direction } = useLocale();
  return (
    <DirectionProvider direction={direction}>
      <RadioGroupPrimitive
        data-slot="radio-group"
        data-orientation={orientation}
        className={cn(
          'group/radio-group flex gap-x-card gap-y-field',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          className,
        )}
        {...props}
      />
    </DirectionProvider>
  );
}

interface RadioGroupItemProps extends Omit<RadioPrimitive.Root.Props<string>, 'children'> {
  /** Visible text next to the radio. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
}

/** One option of a `RadioGroup`; clicking the label selects it. */
function RadioGroupItem({ className, label, description, ...props }: RadioGroupItemProps) {
  const labelId = useId();
  const radio = (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      // Inside a Field every radio would otherwise be named by the field label.
      {...(label === undefined ? {} : { 'aria-labelledby': labelId })}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-stroke-strong bg-surface outline-none',
        'transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'data-[checked]:border-primary data-[checked]:bg-primary',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        'data-[invalid]:border-danger group-aria-invalid/radio-group:border-danger',
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="bg-primary-foreground size-2 rounded-full"
      />
    </RadioPrimitive.Root>
  );

  if (label === undefined) {
    return radio;
  }

  return (
    <label
      data-slot="radio-group-label"
      className={cn(
        'flex min-h-11 cursor-pointer items-start gap-field text-b1 text-text-primary select-none sm:min-h-9',
        props.disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className="flex h-6 items-center">{radio}</span>
      <span className="flex flex-col pt-0.5">
        <span id={labelId}>{label}</span>
        {description ? <span className="text-b3 text-text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
export type { RadioGroupItemProps, RadioGroupProps };
