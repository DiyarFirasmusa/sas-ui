import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends SwitchPrimitive.Root.Props {
  /** `sm` is a 36x20px track for dense rows; the default is 44x24px. */
  size?: 'default' | 'sm';
  /**
   * Mirror the track in right-to-left (default): "on" slides toward the end
   * edge, so to the left in Arabic. Pass `false` for designs that always draw
   * "on" at the physical right.
   */
  mirror?: boolean;
  /** Visible text beside the switch; clicking it toggles. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
}

/**
 * On/off toggle (`role="switch"`). The thumb is positioned with
 * `inset-inline-start`, so it slides toward the end edge in both directions:
 * to the right in English, to the left in Arabic.
 */
function Switch({
  className,
  size = 'default',
  mirror = true,
  label,
  description,
  ...props
}: SwitchProps) {
  const labelId = useId();
  const control = (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      dir={mirror ? undefined : 'ltr'}
      // Inside a Field the field label would otherwise replace this label.
      {...(label === undefined ? {} : { 'aria-labelledby': labelId })}
      className={cn(
        'group/switch relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border border-transparent bg-switch-off outline-none',
        'transition-colors motion-reduce:transition-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'data-[size=sm]:h-5 data-[size=sm]:w-9',
        'data-[checked]:bg-primary',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        'data-[invalid]:border-danger aria-invalid:border-danger',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none absolute start-0.5 size-5 rounded-full bg-surface shadow-small',
          'transition-[inset-inline-start] duration-150 motion-reduce:transition-none',
          'data-[checked]:start-[calc(100%-1.375rem)]',
          'group-data-[size=sm]/switch:size-4 group-data-[size=sm]/switch:data-[checked]:start-[calc(100%-1.125rem)]',
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (label === undefined) {
    return control;
  }

  return (
    <label
      data-slot="switch-label"
      className={cn(
        'flex min-h-11 cursor-pointer items-start gap-field text-b1 text-text-primary select-none sm:min-h-9',
        props.disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className={cn('flex items-center', size === 'sm' ? 'h-5' : 'h-6')}>{control}</span>
      <span className="flex flex-col pt-0.5">
        <span id={labelId}>{label}</span>
        {description ? <span className="text-b3 text-text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export { Switch };
export type { SwitchProps };
