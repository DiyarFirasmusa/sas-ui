import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarCollapseButton,
  SidebarContext,
  type SidebarContextValue,
} from '@/components/ui/sidebar';
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
  /** Sidebar content: `SidebarBrand`, `SidebarContent` with a `SidebarNav`, `SidebarFooter`. Rendered on desktop and in the drawer. */
  sidebar: ReactNode;
  /** Usually a `Topbar`. */
  topbar?: ReactNode;
  /** The page. */
  children: ReactNode;
  /** Controlled desktop rail state. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Hide the built-in collapse button if you render `SidebarCollapseButton` yourself. */
  hideCollapseButton?: boolean;
  /** Id of the main region and target of the skip link. */
  mainId?: string;
  skipLabel?: string;
  navigationLabel?: string;
  /** Classes for the main region (padding, max width). */
  mainClassName?: string;
}

/**
 * Application frame: sidebar at the inline start (right in RTL), a topbar and
 * the page, with a skip link. On desktop the sidebar collapses to an icon
 * rail; below `md` it becomes a drawer opened from the topbar's menu button
 * and closed by Escape, the backdrop or following a link.
 */
function AppShell({
  sidebar,
  topbar,
  children,
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
  const collapsed = collapsedProp ?? internalCollapsed;

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
          {hideCollapseButton ? null : (
            <div
              className={cn(
                'flex shrink-0 border-t border-sidebar-border p-field',
                collapsed ? 'justify-center' : 'justify-end',
              )}
            >
              <SidebarCollapseButton />
            </div>
          )}
        </Sidebar>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="start"
            className="border-sidebar-border bg-sidebar text-sidebar-foreground w-72 max-w-[85vw] p-0 md:hidden"
          >
            <SheetTitle className="sr-only">{labels.navigation}</SheetTitle>
            <SidebarContext value={drawer}>
              <div data-slot="sidebar-drawer" className="flex min-h-0 flex-1 flex-col">
                {sidebar}
              </div>
            </SidebarContext>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          {topbar}
          <main
            id={mainId}
            tabIndex={-1}
            className={cn('min-w-0 flex-1 p-page outline-none max-sm:p-row', mainClassName)}
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
