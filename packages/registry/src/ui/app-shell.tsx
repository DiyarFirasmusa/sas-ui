import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContext,
  type SidebarContextValue,
  type SidebarLayout,
} from '@/components/ui/sidebar';
import { SidebarMobileHeader } from '@/components/ui/sidebar-mobile-header';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'skip' | 'navigation'> = {
  en: { skip: 'Skip to main content', navigation: 'Navigation' },
  ar: { skip: 'تخطي إلى المحتوى الرئيسي', navigation: 'التنقل' },
};

const DESKTOP_QUERY = '(min-width: 768px)';

/** Closes the drawer when the window grows past the breakpoint, so it cannot linger invisibly. */
function useCloseOnDesktop(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const query = globalThis.matchMedia?.(DESKTOP_QUERY);
    if (!query) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        close();
      }
    };
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
    };
  }, [open, close]);
}

interface AppShellProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Sidebar content: `SidebarBrand`, `SidebarTenant`, `SidebarContent` with a `SidebarNav`, `SidebarFooter`. Rendered on desktop and in the drawer. */
  sidebar: ReactNode;
  /** Usually a `Topbar`. */
  topbar?: ReactNode;
  /** The page. */
  children: ReactNode;
  /**
   * Structure of the sidebar and the page padding: `default` is the compact
   * dashboards (collapsible rail, accordion groups), `hr` the comfortable HR
   * one (fixed column, flat sections, tenant card). The top bar follows it.
   */
  variant?: SidebarLayout;
  /**
   * Logo and name for the phone header: a strip in the sidebar's colours with
   * the menu button, shown below `md` above the top bar. Without it the top
   * bar carries the menu button. The `hr` variant always shows the strip.
   */
  mobileBrand?: ReactNode;
  /** Controlled desktop rail state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Leave the rail toggle out of the brand row if you place `SidebarCollapseButton` yourself. */
  hideCollapseButton?: boolean;
  /** Id of the main region and target of the skip link. */
  mainId?: string;
  skipLabel?: string;
  navigationLabel?: string;
  /** Classes for the main region (padding, max width). */
  mainClassName?: string;
}

/**
 * Application frame in the dashboards' layout: the sidebar at the inline start
 * (right in RTL), a top bar and the page, with a skip link. On desktop the
 * sidebar is a 244px column that collapses to a 64px icon rail; below `md` it
 * becomes a drawer opened from the phone header's menu button and closed by
 * Escape, the backdrop or following a link.
 */
function AppShell({
  sidebar,
  topbar,
  children,
  variant = 'default',
  mobileBrand,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  hideCollapseButton = false,
  mainId = 'main-content',
  skipLabel,
  navigationLabel,
  mainClassName,
  className,
  ...props
}: AppShellProps) {
  const labels = useLabels(messages, {
    ...(skipLabel ? { skip: skipLabel } : {}),
    ...(navigationLabel ? { navigation: navigationLabel } : {}),
  });
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hr = variant === 'hr';
  const collapsed = hr ? false : (collapsedProp ?? internalCollapsed);
  const showMobileHeader = hr || mobileBrand !== undefined;

  const setCollapsed = (next: boolean) => {
    if (collapsedProp === undefined) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  };
  const closeMobile = () => {
    setMobileOpen(false);
  };
  useCloseOnDesktop(mobileOpen, closeMobile);

  const shared = {
    inShell: true,
    setCollapsed,
    mobileOpen,
    openMobile: () => {
      setMobileOpen(true);
    },
    closeMobile,
    layout: variant,
    collapsible: !hideCollapseButton && !hr,
    mobileHeader: showMobileHeader,
  } satisfies Partial<SidebarContextValue>;
  const desktop: SidebarContextValue = {
    ...shared,
    collapsed,
    variant: 'desktop',
  };
  const drawer: SidebarContextValue = {
    ...shared,
    collapsed: false,
    variant: 'drawer',
  };

  return (
    <SidebarContext value={desktop}>
      <div
        data-slot="app-shell"
        data-variant={variant}
        className={cn('flex min-h-dvh bg-background text-text-primary', className)}
        {...props}
      >
        <a
          href={`#${mainId}`}
          className="focus:start-inline focus:top-inline focus:rounded-control focus:bg-primary focus:px-row focus:py-field focus:text-button-1 focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:fixed focus:z-50 focus:ring-2 focus:outline-none"
        >
          {labels.skip}
        </a>

        <Sidebar aria-label={labels.navigation} className="sticky top-0 h-dvh max-md:hidden">
          {sidebar}
        </Sidebar>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="start"
            className={cn(
              'border-sidebar-border bg-sidebar text-sidebar-foreground max-w-[85vw] md:hidden',
              hr ? 'w-72 p-row' : 'w-61 p-4',
            )}
          >
            <SheetTitle className="sr-only">{labels.navigation}</SheetTitle>
            <SidebarContext value={drawer}>
              <div
                data-slot="sidebar-drawer"
                className={cn('flex min-h-0 flex-1 flex-col', hr ? 'gap-row' : 'gap-4')}
              >
                {sidebar}
              </div>
            </SidebarContext>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          {showMobileHeader ? <SidebarMobileHeader brand={mobileBrand} /> : null}
          {topbar}
          <main
            id={mainId}
            tabIndex={-1}
            className={cn(
              'min-w-0 flex-1 p-4 outline-none',
              hr ? 'md:px-7.5 md:py-6.5' : 'md:p-page',
              mainClassName,
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarContext>
  );
}

export { AppShell };
export type { AppShellProps };
