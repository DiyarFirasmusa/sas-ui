import { useEffect, useRef, type ComponentType } from 'react';
import { CheckIcon, ChevronRightIcon, type IconProps } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants } from '@/lib/variants';

type StepState = 'complete' | 'current' | 'upcoming';

const messages: Messages<'progress' | 'complete' | 'current' | 'upcoming'> = {
  en: {
    progress: 'Progress',
    complete: 'completed',
    current: 'current step',
    upcoming: 'not started',
  },
  ar: {
    progress: 'التقدم',
    complete: 'مكتملة',
    current: 'الخطوة الحالية',
    upcoming: 'لم تبدأ',
  },
};

const stepVariants = variants(
  [
    'inline-flex h-12 shrink-0 items-center gap-field rounded-control border border-stroke bg-surface px-row text-button-2 whitespace-nowrap',
    'transition-colors duration-150 motion-reduce:transition-none',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    '[&>svg]:size-4.5 [&>svg]:shrink-0',
  ],
  {
    variants: {
      state: {
        complete: 'text-text-primary [&>svg]:text-primary-text',
        current: 'border-primary-highlight bg-primary-light text-primary-text',
        upcoming: 'text-text-inactive',
      },
    },
  },
);

const numberVariants = variants(
  'inline-flex size-6 items-center justify-center rounded-pill text-label tabular-nums',
  {
    variants: {
      current: {
        true: 'bg-primary text-primary-foreground',
        false: 'bg-surface-dim text-text-secondary',
      },
    },
  },
);

interface StepItem<TId extends string = string> {
  id: TId;
  label: string;
  /** Shown instead of the step number while the step is not complete. */
  icon?: ComponentType<IconProps>;
  /** Blocks selecting this step even once it is complete. */
  disabled?: boolean;
}

interface StepsProps<TId extends string = string> {
  items: readonly StepItem<TId>[];
  /** Zero-based index of the step being worked on. Earlier steps are complete. */
  current: number;
  /** Called with a completed step's id and index when it is clicked. Omit to make the steps read-only. */
  onStepSelect?: (id: TId, index: number) => void;
  /** Accessible name of the list. Defaults to "Progress" / "التقدم". */
  label?: string;
  className?: string;
}

function stateOf(index: number, current: number): StepState {
  if (index < current) {
    return 'complete';
  }
  return index === current ? 'current' : 'upcoming';
}

/**
 * Wizard header: a row of chips separated by chevrons that scrolls sideways
 * when it does not fit, and keeps the current step in view. Complete steps
 * swap their number/icon for a check and can be clicked to go back; the
 * current step carries `aria-current="step"`. Each step's state is also
 * spelled out for screen readers, not left to colour alone. For circles on a
 * connector line, use `Stepper` instead.
 */
function Steps<TId extends string = string>({
  items,
  current,
  onStepSelect,
  label,
  className,
}: StepsProps<TId>) {
  const labels = useLabels(messages, label ? { progress: label } : undefined);
  const currentRef = useRef<HTMLLIElement>(null);

  // A long wizard overflows the row on narrow screens; bring the current chip
  // into the visible part (a no-op when it already is).
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current]);

  return (
    <ol
      data-slot="steps"
      aria-label={labels.progress}
      className={cn(
        'flex items-center gap-field overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {items.map((item, index) => {
        const state = stateOf(index, current);
        const Icon = item.icon;
        const interactive = state === 'complete' && onStepSelect !== undefined && !item.disabled;
        const content = (
          <>
            {state === 'complete' ? (
              <CheckIcon />
            ) : Icon ? (
              <Icon />
            ) : (
              <span dir="ltr" className={numberVariants({ current: state === 'current' })}>
                {index + 1}
              </span>
            )}
            {item.label}
            <span className="sr-only">{`, ${labels[state]}`}</span>
          </>
        );
        const chip = interactive ? (
          <button
            type="button"
            data-slot="step"
            data-state={state}
            className={cn(stepVariants({ state }), 'cursor-pointer hover:bg-hover-row')}
            onClick={() => {
              onStepSelect(item.id, index);
            }}
          >
            {content}
          </button>
        ) : (
          <span data-slot="step" data-state={state} className={stepVariants({ state })}>
            {content}
          </span>
        );

        return (
          <li
            key={item.id}
            ref={state === 'current' ? currentRef : undefined}
            data-slot="steps-item"
            aria-current={state === 'current' ? 'step' : undefined}
            className="gap-field flex shrink-0 items-center"
          >
            {index > 0 ? (
              <ChevronRightIcon
                aria-hidden
                data-slot="steps-separator"
                className="text-text-inactive"
              />
            ) : null}
            {chip}
          </li>
        );
      })}
    </ol>
  );
}

export { Steps };
export type { StepItem, StepsProps };
