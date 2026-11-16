import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarInfoCardProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  /** Small line above the title, e.g. "Current entity · Erbil". */
  subtitle?: ReactNode;
}

/**
 * Tinted card in the sidebar column that names the tenant or entity the user
 * works in (the HR sidebar's block). It uses the light brand tint, so it
 * stands out on the deep sidebar colour.
 */
function SidebarInfoCard({ title, subtitle, className, ...props }: SidebarInfoCardProps) {
  return (
    <div
      data-slot="sidebar-info-card"
      className={cn('rounded-xl bg-primary-light px-3 py-3 text-text-primary', className)}
      {...props}
    >
      {subtitle ? (
        <p dir="auto" className="text-b3 text-text-secondary truncate">
          {subtitle}
        </p>
      ) : null}
      <p dir="auto" className="text-h5 truncate">
        {title}
      </p>
    </div>
  );
}

export { SidebarInfoCard };
export type { SidebarInfoCardProps };
