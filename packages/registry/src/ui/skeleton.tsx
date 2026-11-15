import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'loading'> = {
  en: { loading: 'Loading' },
  ar: { loading: 'جارٍ التحميل' },
};

/** Placeholder block. Decorative: group it in a labelled region when it stands for content. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-control bg-surface-dim motion-reduce:animate-none',
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
}

/** Paragraph placeholder; the last line is shorter, like real text. */
function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <SkeletonGroup
      data-slot="skeleton-text"
      className={cn('flex flex-col gap-field', className)}
      {...props}
    >
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </SkeletonGroup>
  );
}

interface SkeletonTableProps extends SkeletonGroupProps {
  rows?: number;
  columns?: number;
}

/** Table placeholder: a header row plus `rows` body rows of `columns` cells. */
function SkeletonTable({ rows = 5, columns = 4, className, ...props }: SkeletonTableProps) {
  const cells = Array.from({ length: Math.max(1, columns) }, (_, index) => index);
  const grid = { gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` };
  return (
    <SkeletonGroup
      data-slot="skeleton-table"
      className={cn('flex flex-col overflow-hidden rounded-xl border border-stroke', className)}
      {...props}
    >
      <div className="grid gap-row border-b border-stroke bg-surface-dim/50 p-row" style={grid}>
        {cells.map((cell) => (
          <Skeleton key={cell} className="h-3 w-2/3" />
        ))}
      </div>
      {Array.from({ length: Math.max(1, rows) }, (_, row) => (
        <div
          key={row}
          className="grid gap-row border-b border-stroke p-row last:border-b-0"
          style={grid}
        >
          {cells.map((cell) => (
            <Skeleton key={cell} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </SkeletonGroup>
  );
}

export { Skeleton, SkeletonTable, SkeletonText };
export type { SkeletonTableProps, SkeletonTextProps };
