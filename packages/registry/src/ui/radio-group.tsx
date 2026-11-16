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
        // The checkbox's 16px box and 50% ink border, drawn round.
        'peer relative inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--text-primary)_50%,transparent)] bg-surface shadow-small outline-none',
        'transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none',
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'data-[checked]:border-primary data-[checked]:bg-primary',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        'data-[invalid]:border-danger data-[invalid]:ring-3 data-[invalid]:ring-danger/20 group-aria-invalid/radio-group:border-danger data-[invalid]:data-[checked]:border-primary',
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="bg-primary-foreground size-1.5 rounded-full"
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
        // The dashboards' `.choice`: field text, turning primary once picked.
        'flex min-h-11 cursor-pointer items-start gap-field text-control-input text-text-primary select-none sm:min-h-0',
        'has-[[data-checked]]:text-primary-text',
        props.disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className="flex h-lh items-center">{radio}</span>
      <span className="flex flex-col">
        <span id={labelId}>{label}</span>
        {description ? <span className="text-b3 text-text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export { RadioGroup, RadioGroupItem };
export type { RadioGroupItemProps, RadioGroupProps };
