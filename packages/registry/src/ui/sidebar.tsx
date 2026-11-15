import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronsLeftIcon, ChevronsRightIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'sidebar' | 'collapse' | 'expand'> = {
  en: {
    sidebar: 'Sidebar',
    collapse: 'Collapse sidebar',
    expand: 'Expand sidebar',
  },
  ar: {
    sidebar: 'الشريط الجانبي',
    collapse: 'طي الشريط الجانبي',
    expand: 'توسيع الشريط الجانبي',
  },
};

/**
 * What the sidebar parts need to know about the shell around them. `AppShell`
 * provides it; outside one, parts behave as a plain expanded desktop sidebar.
 */
interface SidebarContextValue {
  /** True inside an `AppShell`. */
  inShell: boolean;
  /** Desktop icon rail. Always false in the mobile drawer. */
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  variant: 'desktop' | 'drawer';
  mobileOpen: boolean;
  openMobile: () => void;
  /** Closes the drawer; a no-op on desktop. Call it after a navigation. */
  closeMobile: () => void;
}

const noop = () => {};

const SidebarContext = createContext<SidebarContextValue>({
  inShell: false,
  collapsed: false,
  setCollapsed: noop,
  variant: 'desktop',
  mobileOpen: false,
  openMobile: noop,
  closeMobile: noop,
});

function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext);
}

interface SidebarProps extends ComponentProps<'aside'> {
  /** Narrow icon rail instead of the full sidebar. Defaults to the shell's collapsed state. */
  collapsed?: boolean;
}

/**
 * The sidebar column, coloured by the `sidebar-*` tokens. It sits at the
 * inline start of its flex parent, so it is on the right in RTL with no extra
 * work.
 */
function Sidebar({
  className,
  collapsed,
  children,
  'aria-label': ariaLabel,
  ...props
}: SidebarProps) {
  const labels = useLabels(messages);
  const context = useSidebar();
  const rail = collapsed ?? context.collapsed;
  return (
    <aside
      data-slot="sidebar"
      data-collapsed={rail || undefined}
      aria-label={ariaLabel ?? labels.sidebar}
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground',
        'transition-[width] duration-200 motion-reduce:transition-none',
        rail ? 'w-16' : 'w-64',
        className,
      )}
      {...props}
    >
      <SidebarContext value={{ ...context, collapsed: rail }}>{children}</SidebarContext>
    </aside>
  );
}

interface SidebarBrandProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Logo or mark; stays visible in the rail. */
  logo?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}

/** Product mark and name at the top; only the logo shows when the sidebar is a rail. */
function SidebarBrand({ logo, title, subtitle, className, ...props }: SidebarBrandProps) {
  const { collapsed, variant } = useSidebar();
  return (
    <div
      data-slot="sidebar-brand"
      className={cn(
        'flex h-16 shrink-0 items-center gap-inline border-b border-sidebar-border px-inline',
        // The drawer's close button sits at the end of this row.
        variant === 'drawer' && 'pe-14',
        collapsed && 'justify-center px-0',
        className,
      )}
      {...props}
    >
      {logo ? (
        <span className="flex size-9 shrink-0 items-center justify-center">{logo}</span>
      ) : null}
      {collapsed ? null : (
        <span className="flex min-w-0 flex-col">
          <span dir="auto" className="text-h5 truncate">
            {title}
          </span>
          {subtitle ? (
            <span dir="auto" className="text-b3 text-sidebar-foreground/70 truncate">
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

/** Scrolls on its own when the navigation is taller than the viewport. */
function SidebarContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex min-h-0 flex-1 flex-col gap-row overflow-y-auto p-field', className)}
      {...props}
    />
  );
}

/** Pinned to the bottom: account, help, version. Hide detail yourself with `useSidebar().collapsed`. */
function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        'mt-auto flex shrink-0 flex-col gap-field border-t border-sidebar-border p-field',
        collapsed && 'items-center',
        className,
      )}
      {...props}
    />
  );
}

/** Switches between the full sidebar and the icon rail. Desktop only; hidden in the drawer. */
function SidebarCollapseButton({ className, ...props }: ComponentProps<typeof Button>) {
  const labels = useLabels(messages);
  const { collapsed, setCollapsed, variant } = useSidebar();
  if (variant === 'drawer') {
    return null;
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={collapsed ? labels.expand : labels.collapse}
      aria-expanded={!collapsed}
      onClick={() => {
        setCollapsed(!collapsed);
      }}
      className={cn(
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring',
        className,
      )}
      {...props}
    >
      {collapsed ? <ChevronsRightIcon /> : <ChevronsLeftIcon />}
    </Button>
  );
}

export {
  Sidebar,
  SidebarBrand,
  SidebarCollapseButton,
  SidebarContent,
  SidebarContext,
  SidebarFooter,
  useSidebar,
};
export type { SidebarBrandProps, SidebarContextValue, SidebarProps };
