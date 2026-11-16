import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LoaderIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import {
  centerScrollLeft,
  resolveStages,
  segmentClipPath,
  segmentPosition,
  type ResolvedStage,
  type SegmentPosition,
  type StageState,
} from '@/lib/status-bar';
import { cn } from '@/lib/utils';
import { variants } from '@/lib/variants';

type StatusBarLabelKey =
  | 'status'
  | 'complete'
  | 'current'
  | 'upcoming'
  | 'error'
  | 'skipped'
  | 'updating';

const messages: Messages<StatusBarLabelKey> = {
  en: {
    status: 'Status',
    complete: 'completed',
    current: 'current stage',
    upcoming: 'not reached',
    error: 'error',
    skipped: 'skipped',
    updating: 'updating',
  },
  ar: {
    status: 'الحالة',
    complete: 'مكتملة',
    current: 'المرحلة الحالية',
    upcoming: 'لم تُبلغ بعد',
    error: 'خطأ',
    skipped: 'تم تخطيها',
    updating: 'جارٍ التحديث',
  },
};

const segmentVariants = variants(
  'relative flex h-full min-h-11 w-full items-center justify-center gap-field px-4 text-b2 whitespace-nowrap transition-colors motion-reduce:transition-none sm:min-h-9.5',
  {
    variants: {
      state: {
        complete: 'bg-primary-light text-primary-text',
        current: 'bg-primary text-primary-foreground',
        upcoming: 'bg-secondary text-text-secondary',
        error: 'bg-danger text-danger-foreground',
        skipped: 'bg-secondary text-text-muted line-through',
      },
    },
  },
);

interface StatusBarStage {
  id: string;
  label: ReactNode;
  /**
   * Overrides the state worked out from `current`: mark an earlier stage
   * `skipped`, a failed one `error`, or keep progress shown after a rejection.
   */
  state?: StageState;
  /** Blocks choosing this stage when the bar is interactive. */
  disabled?: boolean;
}

interface StatusBarProps extends Omit<React.ComponentProps<'nav'>, 'children' | 'dir'> {
  /** The pipeline, in order. */
  stages: readonly StatusBarStage[];
  /** `id` of the current stage, in `stages` or `terminal`. */
  current: string;
  /** Stages a record can leave the pipeline for (rejected, cancelled), shown after it as separate error-capable segments. */
  terminal?: readonly StatusBarStage[];
  /** Makes every stage but the current one a button. Called with the stage `id`. */
  onStageChange?: (id: string) => void;
  /**
   * Asked before `onStageChange`; resolve `false` (or reject) to cancel. While
   * a promise is pending the bar is busy and ignores further choices.
   */
  confirmChange?: (id: string) => boolean | Promise<boolean>;
  /** Show 1, 2, 3… in front of the pipeline labels (always Latin digits). */
  showNumbers?: boolean;
  /** Overrides for the accessible name and the screen-reader state words. */
  labels?: Partial<Record<StatusBarLabelKey, string>>;
}

function stateWord(item: ResolvedStage<StatusBarStage>, labels: Record<StatusBarLabelKey, string>) {
  const { state, isCurrent } = item;
  if (state === 'current') {
    return labels.current;
  }
  return isCurrent ? `${labels.current}, ${labels[state]}` : labels[state];
}

interface SegmentProps {
  item: ResolvedStage<StatusBarStage>;
  position: SegmentPosition;
  number: number | undefined;
  interactive: boolean;
  pending: boolean;
  busy: boolean;
  firstTerminal: boolean;
  direction: 'ltr' | 'rtl';
  labels: Record<StatusBarLabelKey, string>;
  onChoose: (id: string) => void;
  listItemRef: ((node: HTMLLIElement | null) => void) | undefined;
}

function Segment({
  item,
  position,
  number,
  interactive,
  pending,
  busy,
  firstTerminal,
  direction,
  labels,
  onChoose,
  listItemRef,
}: SegmentProps) {
  const { stage, state, terminal } = item;
  const content = (
    <>
      {number === undefined ? null : (
        <span dir="ltr" className="tabular-nums">
          {number}
        </span>
      )}
      <span>{stage.label}</span>
      {pending ? (
        <LoaderIcon aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
      ) : null}
      <span className="sr-only">{`, ${stateWord(item, labels)}${pending ? `, ${labels.updating}` : ''}`}</span>
    </>
  );
  const clipPath = terminal ? undefined : segmentClipPath(position, direction);
  return (
    <li
      ref={listItemRef}
      data-slot="status-bar-stage"
      data-state={state}
      data-position={terminal ? 'terminal' : position}
      aria-current={item.isCurrent ? 'step' : undefined}
      style={clipPath === undefined || clipPath === 'none' ? undefined : { clipPath }}
      className={cn(
        'flex shrink-0 overflow-hidden',
        // The next arrow's notch nests into this one's point, leaving a 2px gap.
        !terminal && position !== 'first' && position !== 'only' && '-ms-2.5',
        terminal && (firstTerminal ? 'ms-3' : 'ms-1'),
        (terminal || position === 'first' || position === 'only') && 'rounded-s-lg',
        (terminal || position === 'last' || position === 'only') && 'rounded-e-lg',
      )}
    >
      {interactive ? (
        <button
          type="button"
          disabled={stage.disabled}
          aria-disabled={busy && !pending ? true : undefined}
          aria-busy={pending ? true : undefined}
          onClick={() => onChoose(stage.id)}
          className={cn(
            segmentVariants({ state }),
            'cursor-pointer outline-none hover:brightness-95 focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-wait',
          )}
        >
          {content}
        </button>
      ) : (
        <span className={segmentVariants({ state })}>{content}</span>
      )}
    </li>
  );
}

/**
 * Record workflow pipeline, as in the header of an ERP form: arrow-shaped
 * stages pointing at the inline end (right in English, left in Arabic), the
 * current one filled, earlier ones soft, later ones muted. `terminal` stages
 * (rejected, cancelled) follow the pipeline and show as errors when current.
 *
 * Stages are a list with `aria-current="step"` on the current one, and every
 * state is also written out for screen readers. Give it `onStageChange` to
 * let people move the record; `confirmChange` can veto or await that. On
 * screens under `sm` it collapses to a select so long pipelines stay usable.
 */
function StatusBar({
  stages,
  current,
  terminal = [],
  onStageChange,
  confirmChange,
  showNumbers = false,
  labels: labelOverrides,
  className,
  'aria-label': ariaLabel,
  ...props
}: StatusBarProps) {
  const labels = useLabels(messages, labelOverrides);
  const { direction } = useLocale();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLLIElement | null>(null);

  const resolved = resolveStages(stages, terminal, current);
  const busy = pendingId !== null;
  const changeable = onStageChange !== undefined;

  // Keep the current stage in view when the strip overflows. Only the strip
  // scrolls: scrollIntoView could also move the page.
  useEffect(() => {
    const list = listRef.current;
    const item = currentRef.current;
    if (!list || !item || list.scrollWidth <= list.clientWidth) {
      return;
    }
    list.scrollLeft = centerScrollLeft({
      offsetLeft: item.offsetLeft,
      itemWidth: item.offsetWidth,
      clientWidth: list.clientWidth,
      scrollWidth: list.scrollWidth,
      direction,
    });
  }, [current, direction]);

  async function choose(id: string) {
    if (!onStageChange || busy || id === current) {
      return;
    }
    if (!confirmChange) {
      onStageChange(id);
      return;
    }
    setPendingId(id);
    let confirmed = false;
    try {
      confirmed = await confirmChange(id);
    } catch {
      confirmed = false;
    } finally {
      setPendingId(null);
    }
    if (confirmed) {
      onStageChange(id);
    }
  }

  const name = ariaLabel ?? labels.status;
  const currentStage = resolved.find((item) => item.isCurrent);
  const options = resolved.map((item) => ({
    value: item.stage.id,
    label: item.stage.label,
    disabled: item.stage.disabled,
  }));

  return (
    <nav
      data-slot="status-bar"
      dir={direction}
      aria-label={name}
      aria-busy={busy ? true : undefined}
      className={cn('w-full', className)}
      {...props}
    >
      <div data-slot="status-bar-compact" className="sm:hidden">
        {changeable ? (
          <Select
            aria-label={name}
            value={current}
            options={options}
            disabled={busy}
            onValueChange={(next) => {
              if (next !== null) {
                void choose(next);
              }
            }}
          />
        ) : (
          <span
            className={cn(
              'rounded-lg',
              segmentVariants({ state: currentStage?.state ?? 'upcoming' }),
              'justify-start',
            )}
          >
            <span className="sr-only">{`${name}: `}</span>
            {currentStage?.stage.label}
          </span>
        )}
      </div>
      <ol
        ref={listRef}
        data-slot="status-bar-list"
        className="hidden items-stretch overflow-x-auto sm:flex"
      >
        {resolved.map((item, index) => {
          const pipelineIndex = item.terminal ? -1 : index;
          return (
            <Segment
              key={item.stage.id}
              item={item}
              position={segmentPosition(index, stages.length)}
              number={showNumbers && !item.terminal ? pipelineIndex + 1 : undefined}
              interactive={changeable && !item.isCurrent}
              pending={pendingId === item.stage.id}
              busy={busy}
              firstTerminal={item.terminal && index === stages.length}
              direction={direction}
              labels={labels}
              onChoose={(id) => void choose(id)}
              listItemRef={
                item.isCurrent
                  ? (node) => {
                      currentRef.current = node;
                    }
                  : undefined
              }
            />
          );
        })}
      </ol>
    </nav>
  );
}

export { StatusBar, segmentVariants as statusBarSegmentVariants };
export type { StatusBarProps, StatusBarStage };
