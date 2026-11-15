import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DetailFieldProps {
  label: ReactNode;
  /** Empty values (undefined, null, '') render an em dash so the grid never collapses. */
  value?: ReactNode;
  icon?: ReactNode;
  /** `boxed` puts the value in a tinted box for emphasis (comparison results). */
  tone?: 'default' | 'boxed';
  className?: string;
  valueClassName?: string;
}

/**
 * Read-only label/value pair for detail pages. Rendered as a description-list
 * entry so screen readers announce the label with the value.
 */
function DetailField({
  label,
  value,
  icon,
  tone = 'default',
  className,
  valueClassName,
}: DetailFieldProps) {
  const isEmpty = value === undefined || value === null || value === '';
  return (
    <div data-slot="detail-field" className={cn('flex min-w-0 flex-col gap-field', className)}>
      <dt className="flex items-center gap-field text-label text-text-secondary">
        {icon ? (
          <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-light text-primary-text [&>svg]:size-3.5">
            {icon}
          </span>
        ) : null}
        {label}
      </dt>
      <dd
        className={cn(
          'min-w-0 text-b1 break-words text-text-primary',
          tone === 'boxed' &&
            'flex min-h-11 items-center rounded-xl border border-stroke bg-surface-dim px-row py-2',
          valueClassName,
        )}
      >
        {isEmpty ? <span aria-label="—" className="text-text-muted">—</span> : value}
      </dd>
    </div>
  );
}

/** Responsive grid of `DetailField`s inside a description list. */
function DetailGrid({ className, ...props }: React.ComponentProps<'dl'>) {
  return (
    <dl
      data-slot="detail-grid"
      className={cn('grid gap-row sm:grid-cols-2 lg:grid-cols-3', className)}
      {...props}
    />
  );
}

export { DetailField, DetailGrid };
export type { DetailFieldProps };
