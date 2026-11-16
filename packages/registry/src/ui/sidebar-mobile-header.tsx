import type { ComponentProps, ReactNode } from 'react';
import { MenuIcon } from '@/components/ui/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'menu'> = {
  en: { menu: 'Open navigation menu' },
  ar: { menu: 'فتح قائمة التنقل' },
};

interface SidebarMobileHeaderProps extends ComponentProps<'div'> {
  /** Logo and name next to the menu button. */
  brand?: ReactNode;
  menuLabel?: string;
}

/**
 * The phone's top strip in the sidebar's colours: the button that opens the
 * navigation drawer and the product mark. The dashboards show it below `md`,
 * above the top bar. It is a plain block, not a banner, so the top bar stays
 * the page's only banner landmark.
 */
function SidebarMobileHeader({ brand, menuLabel, className, ...props }: SidebarMobileHeaderProps) {
  const labels = useLabels(messages, menuLabel ? { menu: menuLabel } : undefined);
  const { openMobile, mobileOpen } = useSidebar();
  return (
    <div
      data-slot="mobile-header"
      className={cn(
        'sticky top-0 z-30 flex h-18 shrink-0 items-center gap-3 bg-sidebar px-4 text-sidebar-foreground md:hidden',
        className,
      )}
      {...props}
    >
      <button
        type="button"
        aria-label={labels.menu}
        aria-expanded={mobileOpen}
        aria-haspopup="dialog"
        onClick={openMobile}
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-sidebar-ring inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <MenuIcon className="size-5" />
      </button>
      <div className="gap-inline text-h5 flex min-w-0 flex-1 items-center [&>svg]:size-5">
        {brand}
      </div>
    </div>
  );
}

export { SidebarMobileHeader };
export type { SidebarMobileHeaderProps };
