import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Right-hand (inline end) slot: a button, a count badge… */
  action?: ReactNode;
  /** Heading level to keep the document outline correct. */
  level?: 2 | 3 | 4;
  /**
   * Colour of the 4px accent bar before the title (the dashboards' section
   * marker): `primary` (default) or the highlight `gold`. Not drawn when an
   * `icon` is given.
   */
  accent?: 'primary' | 'gold';
}

/** Heading for a page section with optional icon, description and action. */
function SectionTitle({
  title,
  description,
  icon,
  action,
  level = 2,
  accent = 'primary',
  className,
  ...props
}: SectionTitleProps) {
  const Heading = `h${level}` as const;
  return (
    <div
      data-slot="section-title"
      className={cn('flex items-start justify-between gap-row', className)}
      {...props}
    >
      <div className="gap-inline flex min-w-0 items-start">
        {icon === undefined || icon === null ? (
          <span
            aria-hidden="true"
            data-slot="section-title-accent"
            data-accent={accent}
            className={cn(
              'mt-0.5 inline-block h-5 w-1 shrink-0 rounded-pill',
              accent === 'gold' ? 'bg-primary-highlight' : 'bg-primary',
            )}
          />
        ) : (
          <span
            aria-hidden="true"
            className="bg-primary-light text-primary-text grid size-9 shrink-0 place-items-center rounded-lg [&>svg]:size-5"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <Heading className="text-h4 text-text-primary">{title}</Heading>
          {description ? <p className="text-b2 text-text-secondary">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { SectionTitle };
export type { SectionTitleProps };
