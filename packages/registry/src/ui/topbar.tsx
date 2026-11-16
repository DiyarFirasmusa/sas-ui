import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { MenuIcon } from '@/components/ui/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'menu'> = {
  en: { menu: 'Open navigation menu' },
  ar: { menu: 'فتح قائمة التنقل' },
};

/**
 * Which dashboard the bar is dressed as. `sidebar` is the navy bar of the
 * tourism app (the sidebar's colour, translucent chips); `surface` is the
 * inventory app's bar on the page surface; `hr` is the comfortable bar with a
 * title accent, bordered 36px controls and a blurred surface, hidden on phones.
 */
type TopbarVariant = 'sidebar' | 'surface' | 'hr';

const TopbarContext = createContext<TopbarVariant>('sidebar');

/** The variant of the surrounding `Topbar`, so controls inside it dress to match. */
function useTopbarVariant(): TopbarVariant {
  return useContext(TopbarContext);
}

type TopbarChipKind = 'icon' | 'text' | 'account';

const CHIP_BASE =
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-field whitespace-nowrap text-button-2 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default';

const SOLID = 'min-h-11 rounded-lg px-3';
const CHIP_TONE: Record<TopbarVariant, Record<TopbarChipKind, string>> = {
  sidebar: {
    icon: `${SOLID} min-w-11 bg-sidebar-foreground/8 text-sidebar-foreground hover:bg-sidebar-foreground/16 focus-visible:outline-sidebar-ring`,
    text: `${SOLID} bg-sidebar-foreground/8 text-sidebar-foreground hover:bg-sidebar-foreground/16 focus-visible:outline-sidebar-ring`,
    account: `${SOLID} bg-sidebar-accent py-1 text-sidebar-foreground focus-visible:outline-sidebar-ring`,
  },
  surface: {
    icon: `${SOLID} min-w-11 bg-surface text-text-primary hover:bg-hover-row hover:text-primary-text focus-visible:outline-primary-highlight`,
    text: `${SOLID} bg-surface text-text-primary hover:bg-hover-row hover:text-primary-text focus-visible:outline-primary-highlight`,
    account: `${SOLID} bg-primary-light py-1 text-text-primary focus-visible:outline-primary-highlight`,
  },
  hr: {
    icon: 'size-9 rounded-md border border-stroke bg-surface text-text-primary hover:border-primary hover:bg-hover-row hover:text-primary focus-visible:outline-primary',
    text: 'h-9 rounded-md px-2.5 text-text-primary hover:bg-hover-row focus-visible:outline-primary',
    account:
      'h-11 max-w-60 gap-2.5 rounded-md border border-stroke bg-surface-dim px-2 text-text-primary hover:border-primary focus-visible:outline-primary',
  },
};

/** Class names of a top bar control: a 44px chip (36px in the `hr` bar). Use it on any trigger you add. */
function topbarChip(variant: TopbarVariant, kind: TopbarChipKind = 'icon'): string {
  return cn(CHIP_BASE, CHIP_TONE[variant][kind]);
}

const BAR: Record<TopbarVariant, string> = {
  sidebar: 'h-18 border-sidebar-border bg-sidebar text-sidebar-foreground',
  surface: 'h-18 border-sidebar-border bg-surface text-text-primary',
  hr: 'h-15.5 border-primary/5 bg-surface/92 text-text-primary backdrop-blur-sm max-md:hidden md:px-7',
};

interface TopbarProps extends Omit<ComponentProps<'header'>, 'title'> {
  /** Page or product title; truncates rather than wrapping. */
  title?: ReactNode;
  /** Controls at the end: theme, language, notifications, account. */
  actions?: ReactNode;
  /** Content at the start before the title, such as a search field. */
  leading?: ReactNode;
  menuLabel?: string;
  /** Look of the bar; by default `hr` in an `hr` shell and `sidebar` otherwise. */
  variant?: TopbarVariant;
}

/**
 * Sticky top bar: an optional title, an actions slot and — on phones, inside
 * an `AppShell` without its own phone header — the button that opens the
 * navigation drawer. The title is not a heading: render your page's own `<h1>`
 * in the content. Controls inside it (`TopbarThemeSwitch`,
 * `TopbarLanguageMenu`, `NotificationsMenu`, `TopbarAccount`) follow its variant.
 */
function Topbar({
  title,
  actions,
  leading,
  menuLabel,
  variant,
  className,
  children,
  ...props
}: TopbarProps) {
  const labels = useLabels(messages, menuLabel ? { menu: menuLabel } : undefined);
  const { inShell, openMobile, mobileOpen, mobileHeader, layout } = useSidebar();
  const look = variant ?? (layout === 'hr' ? 'hr' : 'sidebar');
  return (
    <TopbarContext value={look}>
      <header
        data-slot="topbar"
        data-variant={look}
        className={cn(
          'sticky top-0 z-30 flex w-full shrink-0 items-center justify-between gap-6 border-b px-4 md:px-6',
          mobileHeader && 'max-md:top-18',
          BAR[look],
          className,
        )}
        {...props}
      >
        {inShell && !mobileHeader ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={labels.menu}
            aria-expanded={mobileOpen}
            aria-haspopup="dialog"
            className={cn(
              'max-md:size-11 md:hidden',
              look === 'sidebar' &&
                'text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground',
            )}
            onClick={openMobile}
          >
            <MenuIcon />
          </Button>
        ) : null}
        {leading}
        {title ? (
          <div className="gap-field flex min-w-0 flex-1 items-center">
            {look === 'hr' ? (
              <span
                aria-hidden="true"
                className="rounded-pill from-gold to-primary h-5 w-[3px] shrink-0 bg-linear-to-b"
              />
            ) : null}
            <div dir="auto" className="text-h4 min-w-0 truncate">
              {title}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {children}
        {actions ? <div className="gap-inline flex shrink-0 items-center">{actions}</div> : null}
      </header>
    </TopbarContext>
  );
}

export { Topbar, TopbarContext, topbarChip, useTopbarVariant };
export type { TopbarChipKind, TopbarProps, TopbarVariant };
