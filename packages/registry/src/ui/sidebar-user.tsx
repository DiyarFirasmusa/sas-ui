import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDownIcon } from '@/components/ui/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarRailTooltip } from '@/components/ui/sidebar-rail-tooltip';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'accountOf'> = {
  en: { accountOf: 'Account menu for {name}' },
  ar: { accountOf: 'قائمة حساب {name}' },
};

interface SidebarUserProps {
  name: string;
  /** Role or e-mail under the name. Hidden in the rail. */
  subtitle?: string;
  avatarSrc?: string;
  /** Menu entries: `DropdownMenuItem`s, separators, sub-menus. */
  children: ReactNode;
  /** Render only in the phone drawer: the HR layout keeps the account in the topbar on desktop. */
  drawerOnly?: boolean;
  /** Overrides the localised accessible name of the trigger in the rail. */
  label?: string;
  className?: string;
}

/**
 * The signed-in user as a block at the bottom of the sidebar: avatar, name and
 * role on a ghost row that opens the account menu upwards. In the rail only
 * the avatar remains, with a tooltip carrying the name.
 */
function SidebarUser({
  name,
  subtitle,
  avatarSrc,
  children,
  drawerOnly = false,
  label,
  className,
}: SidebarUserProps) {
  const labels = useLabels(messages);
  const { collapsed, variant } = useSidebar();
  if (drawerOnly && variant !== 'drawer') {
    return null;
  }
  const accessible = label ?? fillTemplate(labels.accountOf, { name });
  const trigger = (
    <DropdownMenuTrigger
      data-slot="sidebar-user"
      aria-label={collapsed ? accessible : undefined}
      className={cn(
        'flex w-full min-w-0 items-center rounded-control text-start text-sidebar-foreground transition-colors outline-none',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring',
        collapsed ? 'size-11 justify-center' : 'gap-3 px-2 py-2',
        className,
      )}
    >
      <Avatar name={name} src={avatarSrc} size="sm" className="rounded-md" />
      {collapsed ? null : (
        <>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span dir="auto" className="text-h5 truncate">
              {name}
            </span>
            {subtitle ? (
              <span dir="auto" className="text-b3 text-sidebar-foreground/70 truncate">
                {subtitle}
              </span>
            ) : null}
          </span>
          <ChevronsUpDownIcon className="text-sidebar-foreground/50" />
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {collapsed ? <SidebarRailTooltip label={name}>{trigger}</SidebarRailTooltip> : trigger}
      <DropdownMenuContent side="top" align="start" className="min-w-60">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SidebarUser };
export type { SidebarUserProps };
