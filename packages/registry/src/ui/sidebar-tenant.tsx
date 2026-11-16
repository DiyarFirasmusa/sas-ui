import type { ComponentProps, ReactNode } from 'react';
import { BuildingIcon } from '@/components/ui/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarInfoCard } from '@/components/ui/sidebar-info-card';
import { SidebarRailTooltip } from '@/components/ui/sidebar-rail-tooltip';
import { cn } from '@/lib/utils';

interface SidebarTenantProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** What the block is: "Workspace", "Current entity". */
  label: string;
  /** The workspace, warehouse or tenant the user is in. */
  name: string;
  /** Glyph for the rail tile. Defaults to a building. */
  icon?: ReactNode;
  /** Extra detail after the label in the `hr` layout, e.g. a city. */
  detail?: string;
}

/**
 * The workspace the user is in, under the brand. The default layout shows a
 * tinted card with a small label over the name, and a single icon tile with a
 * tooltip in the rail; the `hr` layout shows the info card.
 */
function SidebarTenant({ label, name, icon, detail, className, ...props }: SidebarTenantProps) {
  const { collapsed, layout } = useSidebar();

  if (layout === 'hr') {
    return (
      <SidebarInfoCard
        className={className}
        title={name}
        subtitle={[label, detail].filter(Boolean).join(' · ')}
        {...props}
      />
    );
  }

  if (collapsed) {
    const text = `${label}: ${name}`;
    return (
      <div data-slot="sidebar-tenant" className={cn('flex justify-center', className)} {...props}>
        <SidebarRailTooltip
          label={text}
          render={
            <span
              role="img"
              aria-label={text}
              className="border-sidebar-border bg-sidebar-accent inline-flex rounded-xl border p-[3px]"
            />
          }
        >
          <span className="bg-sidebar-accent text-sidebar-accent-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg [&>svg]:size-5">
            {icon ?? <BuildingIcon />}
          </span>
        </SidebarRailTooltip>
      </div>
    );
  }

  return (
    <div
      data-slot="sidebar-tenant"
      className={cn('flex flex-col gap-1 rounded-xl bg-sidebar-accent p-3', className)}
      {...props}
    >
      <p className="text-b3 text-sidebar-foreground/70">{label}</p>
      <p dir="auto" className="text-label line-clamp-2 wrap-break-word">
        {name}
      </p>
    </div>
  );
}

export { SidebarTenant };
export type { SidebarTenantProps };
