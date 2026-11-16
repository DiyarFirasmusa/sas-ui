import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends SwitchPrimitive.Root.Props {
  /** `sm` is a 24x14px track for dense rows; the default is 32x18.4px (the dashboards' switch). */
  size?: 'default' | 'sm';
  /**
   * Mirror the track in right-to-left: "on" slides toward the end edge, so to
   * the left in Arabic. The dashboards' design draws "on" at the physical right
   * in Arabic too, so the default is `false`.
   */
  mirror?: boolean;
  /** Visible text beside the switch; clicking it toggles. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
}

/**
 * On/off toggle (`role="switch"`) in the dashboards' size: a 32x18.4px track
 * with a 16px thumb (24x14 and 12px at `sm`). The track is pinned
 * left-to-right unless `mirror` is set; the thumb is positioned with
 * `inset-inline-start`, so with `mirror` it slides toward the end edge in both
 * directions (to the left in Arabic).
 */
function Switch({
  className,
  size = 'default',
  mirror = false,
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
        'group/switch relative inline-flex h-[18.4px] w-8 shrink-0 items-center rounded-pill border border-transparent bg-switch-off shadow-small outline-none',
        'transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none',
        // A hit area that reaches 12px/8px beyond the track, as the checkbox's.
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'data-[size=sm]:h-3.5 data-[size=sm]:w-6',
        'data-[checked]:bg-primary',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        'data-[invalid]:border-danger data-[invalid]:ring-3 data-[invalid]:ring-danger/20 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none absolute start-0 block size-4 rounded-full bg-primary-foreground',
          'transition-[inset-inline-start] duration-150 motion-reduce:transition-none',
          'dark:bg-text-inactive dark:data-[checked]:bg-primary-foreground',
          'data-[checked]:start-[calc(100%-1rem)]',
          'group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:data-[checked]:start-[calc(100%-0.75rem)]',
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
        'flex min-h-11 cursor-pointer items-start gap-field text-b1 text-text-primary select-none sm:min-h-0',
        props.disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className="flex h-5.25 items-center">{control}</span>
      <span className="flex flex-col">
        <span id={labelId}>{label}</span>
        {description ? <span className="text-b3 text-text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export { Switch };
export type { SwitchProps };
