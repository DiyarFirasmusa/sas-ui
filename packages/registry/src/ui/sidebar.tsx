import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
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
 * How the sidebar is built. `default` is the compact dashboards' sidebar: brand
 * row with the rail toggle, a workspace card, grouped accordion navigation and
 * a status footer. `hr` is the comfortable (HR) sidebar: a fixed column with
 * the logo, a tenant info card and flat navigation under small headings. The
 * layout is independent of the colour preset.
 */
type SidebarLayout = 'default' | 'hr';

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
  /** Structure of the sidebar. Default `default`. */
  layout?: SidebarLayout;
  /** Whether the brand row offers the rail toggle. Default: in a shell, except in the `hr` layout. */
  collapsible?: boolean;
  /** True when the shell draws its own phone header (menu button and brand), so the topbar skips its menu button. */
  mobileHeader?: boolean;
}

/** The context with every optional field resolved. */
interface SidebarState extends SidebarContextValue {
  layout: SidebarLayout;
  collapsible: boolean;
  mobileHeader: boolean;
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

function useSidebar(): SidebarState {
  const value = useContext(SidebarContext);
  const layout = value.layout ?? 'default';
  return {
    ...value,
    layout,
    collapsible: value.collapsible ?? (value.inShell && layout !== 'hr'),
    mobileHeader: value.mobileHeader ?? false,
  };
}

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring';

interface SidebarProps extends ComponentProps<'aside'> {
  /** Narrow icon rail instead of the full sidebar. Defaults to the shell's collapsed state. */
  collapsed?: boolean;
  /** Structure of the sidebar; defaults to the shell's. */
  variant?: SidebarLayout;
}

/**
 * The sidebar column, coloured by the `sidebar-*` tokens: 244px wide, a 64px
 * rail when collapsed. It sits at the inline start of its flex parent, so it
 * is on the right in RTL with no extra work.
 */
function Sidebar({
  className,
  collapsed,
  variant,
  children,
  'aria-label': ariaLabel,
  ...props
}: SidebarProps) {
  const labels = useLabels(messages);
  const context = useSidebar();
  const layout = variant ?? context.layout;
  const rail = layout === 'hr' ? false : (collapsed ?? context.collapsed);
  return (
    <aside
      data-slot="sidebar"
      data-layout={layout}
      data-collapsed={rail || undefined}
      aria-label={ariaLabel ?? labels.sidebar}
      className={cn(
        'flex shrink-0 flex-col overflow-x-hidden bg-sidebar text-sidebar-foreground',
        layout === 'hr'
          ? 'w-61 gap-row p-row'
          : [
              'gap-row border-e border-sidebar-border py-row',
              'transition-[width] duration-200 motion-reduce:transition-none',
              rail ? 'w-16 px-2' : 'w-61 px-3',
            ],
        className,
      )}
      {...props}
    >
      <SidebarContext value={{ ...context, collapsed: rail, layout }}>{children}</SidebarContext>
    </aside>
  );
}

/** Switches between the full sidebar and the icon rail. Desktop only; hidden in the drawer. */
function SidebarCollapseButton({ className, ...props }: ComponentProps<'button'>) {
  const labels = useLabels(messages);
  const { collapsed, setCollapsed, variant } = useSidebar();
  if (variant === 'drawer') {
    return null;
  }
  const Arrow = collapsed ? ChevronsRightIcon : ChevronsLeftIcon;
  return (
    <button
      type="button"
      data-slot="sidebar-collapse"
      aria-label={collapsed ? labels.expand : labels.collapse}
      aria-expanded={!collapsed}
      onClick={() => {
        setCollapsed(!collapsed);
      }}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border text-sidebar-foreground/70 transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <Arrow />
    </button>
  );
}

interface SidebarBrandProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Logo or mark; stays visible in the rail. */
  logo?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}

/**
 * Product mark and name at the top. In the default layout the rail toggle sits
 * at the end of the row (under the mark in the rail); the `hr` layout has
 * none. Only the logo shows when the sidebar is a rail.
 */
function SidebarBrand({ logo, title, subtitle, className, ...props }: SidebarBrandProps) {
  const { collapsed, variant, layout, collapsible } = useSidebar();
  const toggle = collapsible && variant === 'desktop' ? <SidebarCollapseButton /> : null;
  const mark = logo ? (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center',
        layout === 'hr' ? 'size-10' : 'size-6',
      )}
    >
      {logo}
    </span>
  ) : null;

  if (collapsed) {
    return (
      <div
        data-slot="sidebar-brand"
        className={cn('flex flex-col items-center gap-3', className)}
        {...props}
      >
        {mark}
        {toggle}
      </div>
    );
  }

  return (
    <div
      data-slot="sidebar-brand"
      className={cn(
        'flex shrink-0 items-center',
        layout === 'hr' ? 'h-10 gap-inline' : 'gap-2',
        // The drawer's close button sits at the end of this row.
        variant === 'drawer' && 'pe-10',
        className,
      )}
      {...props}
    >
      {mark}
      <span className="flex min-w-0 flex-1 flex-col">
        <span dir="auto" className={cn('truncate', layout === 'hr' ? 'text-h5' : 'text-h4')}>
          {title}
        </span>
        {subtitle ? (
          <span dir="auto" className="text-b3 text-sidebar-foreground/70 truncate">
            {subtitle}
          </span>
        ) : null}
      </span>
      {toggle}
    </div>
  );
}

/** Scrolls on its own when the navigation is taller than the viewport. */
function SidebarContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('-mx-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-1', className)}
      {...props}
    />
  );
}

interface SidebarFooterProps extends ComponentProps<'div'> {
  /** Service state beside a green dot, e.g. "All systems operational". Only the dot shows in the rail. */
  status?: string;
  /** Build or app version, shown left-to-right at the end of the status row. */
  version?: string;
}

/**
 * Pinned to the bottom under a divider. Pass `status` and `version` for the
 * dashboards' status row, and/or children (a user card, help links); children
 * render as given, so read `useSidebar().collapsed` to shorten them for the rail.
 */
function SidebarFooter({ status, version, className, children, ...props }: SidebarFooterProps) {
  const { collapsed, layout } = useSidebar();
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        'mt-auto flex shrink-0 flex-col gap-field border-t border-sidebar-border',
        layout === 'hr' ? 'pt-row' : 'pt-3',
        collapsed && 'items-center',
        className,
      )}
      {...props}
    >
      {children}
      {status ? (
        collapsed ? (
          <span
            role="img"
            aria-label={status}
            title={status}
            className="bg-success size-2 rounded-full"
          />
        ) : (
          <div className="text-b3 text-sidebar-foreground/70 flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="bg-success size-2 shrink-0 rounded-full" />
              <span className="truncate">{status}</span>
            </span>
            {version ? (
              <span dir="ltr" className="shrink-0 tabular-nums">
                {version}
              </span>
            ) : null}
          </div>
        )
      ) : null}
    </div>
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
export type {
  SidebarBrandProps,
  SidebarContextValue,
  SidebarFooterProps,
  SidebarLayout,
  SidebarProps,
  SidebarState,
};
