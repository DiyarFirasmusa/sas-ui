import type { MouseEventHandler, ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<'increase' | 'decrease' | 'loading'> = {
  en: { increase: 'Increase of', decrease: 'Decrease of', loading: 'Loading' },
  ar: {
    increase: 'زيادة بنسبة',
    decrease: 'انخفاض بنسبة',
    loading: 'جارٍ التحميل',
  },
};

const tileVariants = variants(
  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5',
  {
    variants: {
      tone: {
        primary: 'bg-primary-light text-primary-text',
        success: 'bg-tag-green-container text-tag-green',
        warning: 'bg-tag-yellow-container text-tag-yellow',
        danger: 'bg-tag-red-container text-tag-red',
        info: 'bg-tag-cyan-container text-tag-cyan',
        purple: 'bg-tag-purple-container text-tag-purple',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
);

type DeltaTrend = 'up' | 'down' | 'neutral';
type DeltaTone = 'positive' | 'negative' | 'neutral';

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-text-secondary',
};

interface StatDelta {
  /** Display text such as `12%` or `+3`. Rendered left-to-right. */
  value: string;
  trend: DeltaTrend;
  /**
   * Whether the change is good news. Defaults to up = positive, down = negative;
   * set it for metrics where down is good (costs, refunds, response time).
   */
  tone?: DeltaTone;
  /** Short context after the delta, e.g. "vs last month". */
  caption?: string;
}

interface StatCardProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, 'onClick' | 'children'>,
    VariantProps<typeof tileVariants> {
  label: string;
  /** The headline figure. Strings and numbers are rendered left-to-right. */
  value?: ReactNode;
  delta?: StatDelta;
  /** Optional glyph shown in a coloured tile at the end edge. */
  icon?: ReactNode;
  /** Replaces the figure and delta with skeletons. */
  loading?: boolean;
  /** Makes the whole card a link. */
  href?: string;
  /** Makes the whole card a button (ignored when `href` is set). */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Shown when there is no value yet. Default an em dash. */
  emptyValue?: ReactNode;
}

function resolveTone(delta: StatDelta): DeltaTone {
  if (delta.tone) {
    return delta.tone;
  }
  if (delta.trend === 'up') {
    return 'positive';
  }
  return delta.trend === 'down' ? 'negative' : 'neutral';
}

function DeltaBadge({ delta }: { delta: StatDelta }) {
  const labels = useLabels(messages);
  const Arrow = delta.trend === 'down' ? ArrowDownIcon : ArrowUpIcon;
  const spoken =
    delta.trend === 'neutral' ? null : delta.trend === 'up' ? labels.increase : labels.decrease;
  return (
    <span className="text-b3 flex flex-wrap items-center gap-1">
      <span
        data-slot="stat-card-delta"
        data-trend={delta.trend}
        data-tone={resolveTone(delta)}
        className={cn(
          'inline-flex items-center gap-0.5 font-medium',
          DELTA_TONE_CLASS[resolveTone(delta)],
        )}
      >
        {delta.trend === 'neutral' ? null : <Arrow className="size-3.5" />}
        {spoken ? <span className="sr-only">{spoken}</span> : null}
        <span dir="ltr" className="tabular-nums">
          {delta.value}
        </span>
      </span>
      {delta.caption ? <span className="text-text-muted">{delta.caption}</span> : null}
    </span>
  );
}

const cardClass =
  'block w-full rounded-xl border border-stroke bg-surface p-panel text-start shadow-small';
const interactiveClass =
  'cursor-pointer outline-none transition-colors hover:bg-hover-row focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * KPI tile: label, large figure, optional delta and icon. Pass `href` or
 * `onClick` to make the whole tile one interactive element; use `loading`
 * while the figure is being fetched.
 */
function StatCard({
  label,
  value,
  delta,
  icon,
  tone,
  loading = false,
  href,
  onClick,
  emptyValue = '—',
  className,
  ...props
}: StatCardProps) {
  const labels = useLabels(messages);
  const shown = value === undefined || value === null || value === '' ? emptyValue : value;
  const figure =
    typeof shown === 'string' || typeof shown === 'number' ? (
      <span dir="ltr" className="inline-block">
        {shown}
      </span>
    ) : (
      shown
    );

  const body = (
    <span className="gap-inline flex items-start justify-between">
      <span className="gap-field flex min-w-0 flex-1 flex-col">
        <span className="text-b2 text-text-secondary block">{label}</span>
        {loading ? (
          <>
            <Skeleton className="h-8 w-28" />
            {delta ? <Skeleton className="h-4 w-20" /> : null}
            <span role="status" aria-label={labels.loading} className="sr-only" />
          </>
        ) : (
          <>
            <span className="text-kpi text-text-primary block truncate tabular-nums">{figure}</span>
            {delta ? <DeltaBadge delta={delta} /> : null}
          </>
        )}
      </span>
      {icon ? (
        <span data-slot="stat-card-icon" aria-hidden="true" className={tileVariants({ tone })}>
          {icon}
        </span>
      ) : null}
    </span>
  );

  const shared = {
    'data-slot': 'stat-card',
    'aria-busy': loading || undefined,
    ...props,
  };

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={cn(cardClass, interactiveClass, className)}
        {...shared}
      >
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(cardClass, interactiveClass, className)}
        {...shared}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={cn(cardClass, className)} {...shared}>
      {body}
    </div>
  );
}

const statGridVariants = variants('grid gap-row', {
  variants: {
    columns: {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
    },
  },
  defaultVariants: { columns: 4 },
});

/** Responsive grid for `StatCard`s: 1 column on phones, up to `columns` on wide screens. */
function StatGrid({
  className,
  columns,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof statGridVariants>) {
  return (
    <div data-slot="stat-grid" className={statGridVariants({ columns, className })} {...props} />
  );
}

export { StatCard, StatGrid };
export type { StatCardProps, StatDelta };
