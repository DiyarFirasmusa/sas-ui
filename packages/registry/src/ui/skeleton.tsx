import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'loading'> = {
  en: { loading: 'Loading' },
  ar: { loading: 'جارٍ التحميل' },
};

interface SkeletonProps extends React.ComponentProps<'div'> {
  /**
   * Sweep a highlight across the block instead of pulsing it. Needs the
   * `animate-skeleton-shimmer` utility from the theme (`@sas-ui/tokens`
   * foundation); reduced motion stops it. Default false (pulse).
   */
  shimmer?: boolean;
}

/** Placeholder block. Decorative: group it in a labelled region when it stands for content. */
function Skeleton({ className, shimmer = false, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      data-shimmer={shimmer ? '' : undefined}
      aria-hidden="true"
      className={cn(
        'rounded-control bg-surface-dim',
        shimmer
          ? 'animate-skeleton-shimmer bg-linear-to-r from-surface-dim via-surface to-surface-dim bg-size-[200%_100%] motion-reduce:animate-none rtl:[animation-direction:reverse]'
          : 'animate-pulse motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

interface SkeletonGroupProps extends React.ComponentProps<'div'> {
  /** Accessible name for the loading region; defaults to "Loading". */
  label?: string;
}

function SkeletonGroup({ className, label, children, ...props }: SkeletonGroupProps) {
  const labels = useLabels(messages, label ? { loading: label } : undefined);
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={labels.loading}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

interface SkeletonTextProps extends SkeletonGroupProps {
  /** Number of lines. Default 3. */
  lines?: number;
  /** Shimmer the lines instead of pulsing them. */
  shimmer?: boolean;
}

/** Paragraph placeholder; the last line is shorter, like real text. */
function SkeletonText({ lines = 3, shimmer, className, ...props }: SkeletonTextProps) {
  return (
    <SkeletonGroup
      data-slot="skeleton-text"
      className={cn('flex flex-col gap-field', className)}
      {...props}
    >
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          key={index}
          shimmer={shimmer}
          className={cn('h-4', index === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </SkeletonGroup>
  );
}

interface SkeletonTableProps extends SkeletonGroupProps {
  rows?: number;
  columns?: number;
  /** Shimmer the cells instead of pulsing them. */
  shimmer?: boolean;
}

/** Table placeholder: a header row plus `rows` body rows of `columns` cells. */
function SkeletonTable({
  rows = 5,
  columns = 4,
  shimmer,
  className,
  ...props
}: SkeletonTableProps) {
  const cells = Array.from({ length: Math.max(1, columns) }, (_, index) => index);
  const grid = {
    gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
  };
  return (
    <SkeletonGroup
      data-slot="skeleton-table"
      className={cn('flex flex-col overflow-hidden rounded-xl border border-stroke', className)}
      {...props}
    >
      <div className="gap-row border-stroke bg-surface-dim/50 p-row grid border-b" style={grid}>
        {cells.map((cell) => (
          <Skeleton key={cell} shimmer={shimmer} className="h-3 w-2/3" />
        ))}
      </div>
      {Array.from({ length: Math.max(1, rows) }, (_, row) => (
        <div
          key={row}
          className="gap-row border-stroke p-row grid border-b last:border-b-0"
          style={grid}
        >
          {cells.map((cell) => (
            <Skeleton key={cell} shimmer={shimmer} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </SkeletonGroup>
  );
}

export { Skeleton, SkeletonTable, SkeletonText };
export type { SkeletonProps, SkeletonTableProps, SkeletonTextProps };
