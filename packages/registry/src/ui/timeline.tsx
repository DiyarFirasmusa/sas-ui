import { Children, type ReactNode } from 'react';
import { DotIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const markerVariants = variants(
  'flex size-8 shrink-0 items-center justify-center rounded-pill [&>svg]:size-4',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-dim text-text-secondary',
        primary: 'bg-primary-light text-primary-text',
        success: 'bg-tag-green-container text-tag-green',
        warning: 'bg-tag-yellow-container text-tag-yellow',
        danger: 'bg-tag-red-container text-tag-red',
        info: 'bg-tag-cyan-container text-tag-cyan',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

interface TimelineProps extends React.ComponentProps<'ol'> {
  /** Rendered instead of the list when there are no events. */
  empty?: ReactNode;
}

/**
 * Vertical event list, an ordered list for assistive tech. The rail is laid out
 * with flexbox, so it sits at the start edge in both LTR and RTL.
 */
function Timeline({ className, children, empty, ...props }: TimelineProps) {
  if (empty !== undefined && Children.count(children) === 0) {
    return <div data-slot="timeline-empty">{empty}</div>;
  }
  return (
    <ol
      data-slot="timeline"
      // list-style is reset by the preflight, which makes Safari drop list semantics.
      role="list"
      className={cn('flex flex-col', className)}
      {...props}
    >
      {children}
    </ol>
  );
}

interface TimelineItemProps
  extends Omit<React.ComponentProps<'li'>, 'title'>, VariantProps<typeof markerVariants> {
  title: ReactNode;
  /** When it happened, in display form. */
  time?: ReactNode;
  /** Machine-readable timestamp for the `<time>` element. */
  dateTime?: string;
  description?: ReactNode;
  /** Marker glyph; defaults to a dot. */
  icon?: ReactNode;
  /** Screen-reader text for the status the tone expresses, e.g. "Failed". */
  statusLabel?: string;
}

function TimelineItem({
  className,
  title,
  time,
  dateTime,
  description,
  icon,
  tone,
  statusLabel,
  children,
  ...props
}: TimelineItemProps) {
  return (
    <li
      data-slot="timeline-item"
      data-tone={tone ?? 'neutral'}
      className={cn('group/item flex gap-inline', className)}
      {...props}
    >
      <div className="flex flex-col items-center">
        <span aria-hidden="true" data-slot="timeline-marker" className={markerVariants({ tone })}>
          {icon ?? <DotIcon />}
        </span>
        <span aria-hidden="true" className="bg-stroke mt-1 w-px flex-1 group-last/item:hidden" />
      </div>
      <div className="pb-card flex min-w-0 flex-1 flex-col gap-1 pt-1 group-last/item:pb-0">
        <div className="gap-x-inline flex flex-wrap items-baseline justify-between gap-y-0.5">
          <p className="text-h5 text-text-primary">
            {statusLabel ? <span className="sr-only">{statusLabel}: </span> : null}
            {title}
          </p>
          {time ? (
            <time dateTime={dateTime} className="text-b3 text-text-muted">
              {time}
            </time>
          ) : null}
        </div>
        {description ? <p className="text-b2 text-text-secondary">{description}</p> : null}
        {children}
      </div>
    </li>
  );
}

export { Timeline, TimelineItem };
export type { TimelineItemProps, TimelineProps };
