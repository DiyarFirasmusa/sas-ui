import { useState, type ReactNode } from 'react';
import {
  ShellNotifications,
  type ShellNotification,
} from '@/components/blocks/shell-notifications';
import {
  sampleCommands,
  sampleNav,
  sampleNotifications,
  sampleUser,
} from '@/components/blocks/shell-sample';
import { navSearchItems, ShellSearch, type SearchItem } from '@/components/blocks/shell-search';
import { ShellTopNav, type ShellRenderLink } from '@/components/blocks/shell-top-nav';
import { ShellUserMenu, type ShellUser } from '@/components/blocks/shell-user-menu';
import { Button } from '@/components/ui/button';
import { BuildingIcon, MenuIcon } from '@/components/ui/icons';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { useLabels, useLocale, type Locale, type Messages } from '@/lib/locale';
import type { NavItem } from '@/lib/nav-utils';
import type { ColorMode } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<'brand' | 'pages' | 'menu' | 'skip'> = {
  en: {
    brand: 'SAS Suite',
    pages: 'Pages',
    menu: 'Open navigation menu',
    skip: 'Skip to main content',
  },
  ar: {
    brand: 'حزمة ساس',
    pages: 'الصفحات',
    menu: 'فتح قائمة التنقل',
    skip: 'تخطي إلى المحتوى الرئيسي',
  },
};

const containerVariants = variants('mx-auto w-full p-page max-sm:p-row', {
  variants: {
    width: {
      md: 'max-w-3xl',
      lg: 'max-w-5xl',
      xl: 'max-w-7xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: { width: 'xl' },
});

interface Shell02Props
  extends
    Omit<React.ComponentProps<'div'>, 'children' | 'title'>,
    VariantProps<typeof containerVariants> {
  /** Navigation tree. A group becomes a dropdown on desktop and an accordion in the phone sheet. */
  items?: readonly NavItem[];
  currentPath?: string;
  onNavigate?: (item: NavItem) => void;
  /** Render links with your router's `Link`; applies to the menu, its dropdowns and the phone sheet. */
  renderLink?: ShellRenderLink;
  brand?: { logo?: ReactNode; title: ReactNode };
  user?: ShellUser;
  onProfile?: () => void;
  onSignOut?: () => void;
  onLocaleChange?: (locale: Locale) => void;
  mode?: ColorMode;
  onModeChange?: (mode: ColorMode) => void;
  notifications?: readonly ShellNotification[];
  onNotificationSelect?: (notification: ShellNotification) => void;
  onMarkAllRead?: () => void;
  commands?: readonly SearchItem[];
  onCommandSelect?: (command: SearchItem) => void;
  /** Id of the main region and target of the skip link. */
  mainId?: string;
  children: ReactNode;
}

/**
 * Top-navigation layout, with no sidebar: brand, a horizontal menu whose
 * groups open dropdowns, search (⌘K / Ctrl+K), notifications and the account
 * menu. Below `lg` the menu moves into a sheet opened by a hamburger. The
 * page sits in a centred container; `width` sets its maximum.
 */
function Shell02({
  items,
  currentPath,
  onNavigate,
  renderLink,
  brand,
  user,
  onProfile,
  onSignOut,
  onLocaleChange,
  mode,
  onModeChange,
  notifications,
  onNotificationSelect,
  onMarkAllRead,
  commands,
  onCommandSelect,
  mainId = 'main-content',
  width,
  children,
  className,
  ...props
}: Shell02Props) {
  const labels = useLabels(messages);
  const { locale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = items ?? sampleNav(locale);
  const searchItems = [
    ...navSearchItems(navItems, labels.pages),
    ...(commands ?? sampleCommands(locale)),
  ];

  const navigate = (item: NavItem) => {
    setMenuOpen(false);
    onNavigate?.(item);
  };
  const selectCommand = (command: SearchItem) => {
    const page = navItems.find((item) => item.id === command.id);
    if (page) {
      navigate(page);
    }
    onCommandSelect?.(command);
  };

  return (
    <div
      data-slot="shell-02"
      className={cn('bg-background text-text-primary flex min-h-dvh flex-col', className)}
      {...props}
    >
      <a
        href={`#${mainId}`}
        className="focus:start-inline focus:top-inline focus:rounded-control focus:bg-primary focus:px-row focus:py-field focus:text-button-1 focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:fixed focus:z-50 focus:ring-2 focus:outline-none"
      >
        {labels.skip}
      </a>
      <header className="border-stroke bg-surface gap-row px-row sticky top-0 z-30 flex h-16 shrink-0 items-center border-b">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={labels.menu}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="max-lg:size-11 lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </Button>
          <SheetContent
            side="start"
            className="border-sidebar-border bg-sidebar text-sidebar-foreground w-72 max-w-[85vw] p-0 lg:hidden"
          >
            <SheetTitle className="sr-only">{labels.brand}</SheetTitle>
            <div className="border-sidebar-border px-inline flex h-16 shrink-0 items-center border-b pe-14">
              <span dir="auto" className="text-h5 truncate">
                {brand?.title ?? labels.brand}
              </span>
            </div>
            <div className="p-field min-h-0 flex-1 overflow-y-auto">
              <SidebarNav
                items={navItems}
                currentPath={currentPath}
                accordion
                onNavigate={navigate}
                renderLink={renderLink}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="gap-inline flex shrink-0 items-center">
          {brand?.logo ?? (
            <span className="bg-primary text-primary-foreground rounded-control flex size-9 items-center justify-center">
              <BuildingIcon className="size-5" />
            </span>
          )}
          <span dir="auto" className="text-h5 max-sm:hidden">
            {brand?.title ?? labels.brand}
          </span>
        </div>

        <ShellTopNav
          items={navItems}
          currentPath={currentPath}
          onNavigate={onNavigate}
          renderLink={renderLink}
          className="min-w-0 flex-1 max-lg:hidden"
        />
        <div className="flex-1 lg:hidden" />

        <div className="gap-field flex shrink-0 items-center">
          <ShellSearch items={searchItems} onSelect={selectCommand} />
          <ShellNotifications
            notifications={notifications ?? sampleNotifications(locale)}
            onSelect={onNotificationSelect}
            onMarkAllRead={onMarkAllRead}
          />
          <ShellUserMenu
            user={user ?? sampleUser(locale)}
            onProfile={onProfile}
            onSignOut={onSignOut}
            onLocaleChange={onLocaleChange}
            mode={mode}
            onModeChange={onModeChange}
          />
        </div>
      </header>
      <main
        id={mainId}
        tabIndex={-1}
        className={cn('min-w-0 flex-1 outline-none', containerVariants({ width }))}
      >
        {children}
      </main>
    </div>
  );
}

export { Shell02 };
export type { Shell02Props };
