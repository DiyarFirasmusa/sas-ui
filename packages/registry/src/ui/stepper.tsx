import { Fragment, type ReactNode } from 'react';
import { AlertTriangleIcon, CheckIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants } from '@/lib/variants';

type StepState = 'complete' | 'current' | 'upcoming' | 'error';

const messages: Messages<'progress' | 'step' | 'complete' | 'current' | 'upcoming' | 'error'> = {
  en: {
    progress: 'Progress',
    step: 'Step {n} of {total}',
    complete: 'completed',
    current: 'current step',
    upcoming: 'not started',
    error: 'has an error',
  },
  ar: {
    progress: 'التقدم',
    step: 'الخطوة {n} من {total}',
    complete: 'مكتملة',
    current: 'الخطوة الحالية',
    upcoming: 'لم تبدأ',
    error: 'بها خطأ',
  },
};

const indicatorVariants = variants(
  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-pill border-2 text-label transition-colors motion-reduce:transition-none',
  {
    variants: {
      state: {
        complete: 'border-primary bg-primary text-primary-foreground',
        current: 'border-primary bg-surface text-primary-text',
        upcoming: 'border-stroke-strong bg-surface text-text-muted',
        error: 'border-danger bg-tag-red-container text-danger',
      },
    },
  },
);

interface StepperStep {
  label: ReactNode;
  description?: ReactNode;
  /** Marks the step as failed, whatever its position. */
  error?: boolean;
  /** Blocks clicking this step when the stepper is interactive. */
  disabled?: boolean;
}

interface StepperProps extends Omit<React.ComponentProps<'ol'>, 'children'> {
  steps: StepperStep[];
  /** Zero-based index of the current step; earlier steps are complete. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  /** Makes steps buttons. Called with the zero-based index. */
  onStepClick?: (index: number) => void;
  /** Accessible name of the list. Defaults to "Progress" / "التقدم". */
  label?: string;
}

function stateOf(index: number, current: number, error: boolean | undefined): StepState {
  if (error) {
    return 'error';
  }
  if (index < current) {
    return 'complete';
  }
  return index === current ? 'current' : 'upcoming';
}

/**
 * Progress through a multi-step flow. The visual order and the connectors
 * follow the page direction; step numbers are Latin digits in every language.
 * The current step carries `aria-current="step"` and each step's state is
 * also spelled out for screen readers, not left to colour alone.
 */
function Stepper({
  steps,
  current,
  orientation = 'horizontal',
  onStepClick,
  label,
  className,
  ...props
}: StepperProps) {
  const labels = useLabels(messages, label ? { progress: label } : undefined);
  const vertical = orientation === 'vertical';

  return (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      aria-label={labels.progress}
      className={cn('flex w-full', vertical ? 'flex-col' : 'flex-row items-start', className)}
      {...props}
    >
      {steps.map((step, index) => {
        const state = stateOf(index, current, step.error);
        const last = index === steps.length - 1;
        const interactive = onStepClick !== undefined && !step.disabled;
        const description = [
          labels.step.replace('{n}', String(index + 1)).replace('{total}', String(steps.length)),
          labels[state],
        ].join(', ');

        const indicator = (
          <span data-slot="stepper-indicator" data-state={state} className={indicatorVariants({ state })}>
            {state === 'complete' ? (
              <CheckIcon />
            ) : state === 'error' ? (
              <AlertTriangleIcon />
            ) : (
              <span dir="ltr">{index + 1}</span>
            )}
          </span>
        );
        const text = (
          <span className={cn('flex min-w-0 flex-col gap-0.5', vertical ? 'items-start text-start' : 'items-center text-center')}>
            <span
              className={cn(
                'text-h5',
                state === 'upcoming' ? 'text-text-muted' : 'text-text-primary',
                state === 'error' && 'text-danger',
              )}
            >
              {step.label}
              <span className="sr-only">{`, ${description}`}</span>
            </span>
            {step.description ? <span className="text-b3 text-text-muted">{step.description}</span> : null}
          </span>
        );
        const body = (
          <Fragment>
            {indicator}
            {text}
          </Fragment>
        );
        const bodyClasses = cn(
          'rounded-md outline-none',
          vertical ? 'flex items-start gap-inline' : 'flex flex-col items-center gap-field px-1',
        );
        const content = interactive ? (
          <button
            type="button"
            onClick={() => onStepClick(index)}
            className={cn(
              bodyClasses,
              'min-h-11 cursor-pointer transition-colors hover:bg-hover-row motion-reduce:transition-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            {body}
          </button>
        ) : (
          <div className={bodyClasses}>{body}</div>
        );

        return (
          <li
            key={index}
            data-slot="stepper-item"
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn('relative', vertical ? 'flex flex-col items-start pb-card last:pb-0' : 'flex flex-1 justify-center')}
          >
            {content}
            {last ? null : (
              <span
                aria-hidden="true"
                data-slot="stepper-connector"
                className={cn(
                  'absolute transition-colors motion-reduce:transition-none',
                  index < current ? 'bg-primary' : 'bg-stroke',
                  // Logical offsets: the line runs from this step's indicator
                  // towards the next one, in whichever direction that is.
                  vertical
                    ? 'start-4 top-9.5 bottom-1.5 w-0.5 -translate-x-1/2 rtl:translate-x-1/2'
                    : 'top-4 h-0.5 -translate-y-1/2 start-[calc(50%+1.25rem)] end-[calc(-50%+1.25rem)]',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper, indicatorVariants as stepIndicatorVariants };
export type { StepState, StepperProps, StepperStep };
