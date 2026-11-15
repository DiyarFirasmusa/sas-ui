import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { MenuIcon } from '@/components/ui/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'menu'> = {
  en: { menu: 'Open navigation menu' },
  ar: { menu: 'فتح قائمة التنقل' },
};

interface TopbarProps extends Omit<ComponentProps<'header'>, 'title'> {
  /** Page or product title; truncates rather than wrapping. */
  title?: ReactNode;
  /** Controls at the end: search, notifications, account menu, theme switcher. */
  actions?: ReactNode;
  /** Content at the start next to the title, such as breadcrumbs. */
  leading?: ReactNode;
  menuLabel?: string;
}

/**
 * Sticky top bar with a title slot, an actions slot and — on small screens,
 * inside an `AppShell` — the button that opens the navigation drawer. The
 * title is not a heading: render your page's own `<h1>` in the content.
 */
function Topbar({
  title,
  actions,
  leading,
  menuLabel,
  className,
  children,
  ...props
}: TopbarProps) {
  const labels = useLabels(messages, menuLabel ? { menu: menuLabel } : undefined);
  const { inShell, openMobile, mobileOpen } = useSidebar();
  return (
    <header
      data-slot="topbar"
      className={cn(
        'sticky top-0 z-30 flex h-16 shrink-0 items-center gap-row border-b border-stroke bg-surface px-row text-text-primary',
        className,
      )}
      {...props}
    >
      {inShell ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={labels.menu}
          aria-expanded={mobileOpen}
          aria-haspopup="dialog"
          className="max-md:size-11 md:hidden"
          onClick={openMobile}
        >
          <MenuIcon />
        </Button>
      ) : null}
      {leading}
      {title ? (
        <div dir="auto" className="text-h4 min-w-0 flex-1 truncate">
          {title}
        </div>
      ) : (
        <div className="flex-1" />
      )}
      {children}
      {actions ? <div className="gap-field flex shrink-0 items-center">{actions}</div> : null}
    </header>
  );
}

export { Topbar };
export type { TopbarProps };
