import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'minimum' | 'maximum'> = {
  en: { minimum: 'Minimum', maximum: 'Maximum' },
  ar: { minimum: 'الحد الأدنى', maximum: 'الحد الأعلى' },
};

interface SliderProps extends Omit<
  SliderPrimitive.Root.Props<number | readonly number[]>,
  'children' | 'orientation'
> {
  /** Show the current value (or "from – to" for a range) above the track. */
  showValue?: boolean;
  /** Overrides for the range thumbs' accessible names. */
  labels?: Partial<Record<'minimum' | 'maximum', string>>;
}

/**
 * Single-value or range slider. Pass a number for one thumb, an array for a
 * range. It reads the UI direction, so in Arabic the minimum sits on the right
 * and the arrow keys follow the track. Digits are always Latin.
 */
function Slider({
  className,
  showValue = false,
  labels: labelOverrides,
  value,
  defaultValue,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  ...props
}: SliderProps) {
  const labels = useLabels(messages, labelOverrides);
  const { direction } = useLocale();
  const current = value ?? defaultValue ?? props.min ?? 0;
  const thumbCount = typeof current === 'number' ? 1 : current.length;
  const rangeLabels = [labels.minimum, labels.maximum];

  return (
    <DirectionProvider direction={direction}>
      <SliderPrimitive.Root
        data-slot="slider"
        locale="en-US"
        value={value}
        defaultValue={defaultValue}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        className={cn('group/slider flex w-full flex-col gap-field', className)}
        {...props}
      >
        {showValue ? (
          <SliderPrimitive.Value
            data-slot="slider-value"
            dir="ltr"
            className="text-b2 text-text-secondary tabular-nums rtl:text-start"
          />
        ) : null}
        <SliderPrimitive.Control
          data-slot="slider-control"
          className="flex min-h-11 w-full touch-none items-center select-none data-[disabled]:cursor-not-allowed"
        >
          <SliderPrimitive.Track className="rounded-pill bg-stroke relative h-1.5 w-full select-none">
            <SliderPrimitive.Indicator
              className={cn(
                'rounded-pill bg-primary select-none',
                'data-[invalid]:bg-danger group-aria-invalid/slider:bg-danger',
                'data-[disabled]:bg-text-inactive',
              )}
            />
            {Array.from({ length: thumbCount }, (_, index) => (
              <SliderPrimitive.Thumb
                key={index}
                index={index}
                data-slot="slider-thumb"
                {...(ariaLabel !== undefined || thumbCount > 1
                  ? {
                      getAriaLabel: () =>
                        thumbCount > 1
                          ? [ariaLabel, rangeLabels[index]].filter(Boolean).join(' – ')
                          : (ariaLabel ?? ''),
                    }
                  : {})}
                className={cn(
                  'size-5 rounded-full border-2 border-primary bg-surface shadow-small outline-none select-none',
                  'transition-shadow motion-reduce:transition-none',
                  'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                  'data-[invalid]:border-danger group-aria-invalid/slider:border-danger',
                  'data-[disabled]:border-text-inactive data-[disabled]:cursor-not-allowed',
                )}
              />
            ))}
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    </DirectionProvider>
  );
}

export { Slider };
export type { SliderProps };
