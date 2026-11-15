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
}

/** Heading for a page section with optional icon, description and action. */
function SectionTitle({
  title,
  description,
  icon,
  action,
  level = 2,
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
      <div className="flex min-w-0 items-start gap-inline">
        {icon ? (
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-light text-primary-text [&>svg]:size-5">
            {icon}
          </span>
        ) : null}
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
