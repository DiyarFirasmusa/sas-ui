import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import type { ReactNode } from 'react';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<'progress'> = {
  en: { progress: 'Progress' },
  ar: { progress: 'التقدّم' },
};

const indicatorVariants = variants(
  'block h-full rounded-pill transition-[width] duration-300 motion-reduce:transition-none data-[indeterminate]:w-2/5 data-[indeterminate]:animate-pulse motion-reduce:data-[indeterminate]:animate-none',
  {
    variants: {
      tone: {
        primary: 'bg-primary',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-danger',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
);

const trackVariants = variants('relative w-full overflow-hidden rounded-pill bg-surface-dim', {
  variants: { size: { sm: 'h-1.5', md: 'h-2.5' } },
  defaultVariants: { size: 'md' },
});

interface ProgressProps
  extends Omit<ProgressPrimitive.Root.Props, 'value' | 'format' | 'locale' | 'children'>,
    VariantProps<typeof indicatorVariants>,
    VariantProps<typeof trackVariants> {
  /** Current value, or `null` while the amount of work is unknown (indeterminate). */
  value: number | null;
  /** Visible name. Without it the bar is named by `aria-label` or the localized "Progress". */
  label?: ReactNode;
  /** Show the percentage beside the label. Default true; never shown when indeterminate. */
  showValue?: boolean;
}

/**
 * Progress bar. The percentage is always formatted with Latin digits, in every
 * locale, so figures match the rest of the numbers in the UI.
 */
function Progress({
  className,
  value,
  label,
  showValue = true,
  tone,
  size,
  'aria-label': ariaLabel,
  ...props
}: ProgressProps) {
  const labels = useLabels(messages);
  const hasHeader = Boolean(label) || (showValue && value !== null);
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      locale="en-US"
      aria-label={label ? undefined : (ariaLabel ?? labels.progress)}
      className={cn('flex w-full flex-col gap-field', className)}
      {...props}
    >
      {hasHeader ? (
        <div className="flex items-center justify-between gap-field text-b2">
          {label ? (
            <ProgressPrimitive.Label className="text-text-primary">{label}</ProgressPrimitive.Label>
          ) : (
            <span />
          )}
          {showValue && value !== null ? (
            <ProgressPrimitive.Value dir="ltr" className="text-text-secondary tabular-nums" />
          ) : null}
        </div>
      ) : null}
      <ProgressPrimitive.Track className={trackVariants({ size })}>
        <ProgressPrimitive.Indicator data-slot="progress-indicator" className={indicatorVariants({ tone })} />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
export type { ProgressProps };
