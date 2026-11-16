import type { ReactNode } from 'react';
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
import { ShellUserMenu, type ShellUser } from '@/components/blocks/shell-user-menu';
import { AppShell, type AppShellProps } from '@/components/ui/app-shell';
import { BuildingIcon } from '@/components/ui/icons';
import { SidebarBrand, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav, type RenderNavLink } from '@/components/ui/sidebar-nav';
import { Topbar } from '@/components/ui/topbar';
import { useLabels, useLocale, type Locale, type Messages } from '@/lib/locale';
import type { NavItem } from '@/lib/nav-utils';
import type { ColorMode } from '@/lib/theme';

const messages: Messages<'brand' | 'pages'> = {
  en: { brand: 'SAS Suite', pages: 'Pages' },
  ar: { brand: 'حزمة ساس', pages: 'الصفحات' },
};

/** Default logo: the primary colour in a rounded tile. Replace it through `brand.logo`. */
function BrandMark() {
  return (
    <span className="bg-primary text-primary-foreground rounded-control flex size-9 items-center justify-center">
      <BuildingIcon className="size-5" />
    </span>
  );
}

interface Shell01Props extends Omit<AppShellProps, 'sidebar' | 'topbar' | 'children' | 'title'> {
  /** Navigation tree; groups expand in the sidebar and filter nothing, so pass only what the user may see. */
  items?: readonly NavItem[];
  currentPath?: string;
  /** Opening a group closes its siblings. */
  accordion?: boolean;
  /** Called when a nav link or a palette page is chosen; drive your router from it. */
  onNavigate?: (item: NavItem) => void;
  renderLink?: RenderNavLink;
  /** Product mark and name at the top of the sidebar. */
  brand?: { logo?: ReactNode; title: ReactNode; subtitle?: ReactNode };
  user?: ShellUser;
  onProfile?: () => void;
  onSignOut?: () => void;
  /** The language and theme entries of the account menu appear when these are set. */
  onLocaleChange?: (locale: Locale) => void;
  mode?: ColorMode;
  onModeChange?: (mode: ColorMode) => void;
  notifications?: readonly ShellNotification[];
  onNotificationSelect?: (notification: ShellNotification) => void;
  onMarkAllRead?: () => void;
  /** Palette entries besides the pages taken from `items`. */
  commands?: readonly SearchItem[];
  onCommandSelect?: (command: SearchItem) => void;
  /** Page title shown in the topbar; render your own `<h1>` in the content. */
  title?: ReactNode;
  /** Extra controls in the topbar, before search and notifications. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Application layout: a collapsible sidebar (drawer on phones) with brand,
 * data-driven navigation and an account menu, and a topbar with a title slot,
 * a ⌘K / Ctrl+K command palette and a notification bell. `children` is the
 * page. Every list and handler is a prop with a sample default.
 */
function Shell01({
  items,
  currentPath,
  accordion = true,
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
  title,
  actions,
  children,
  ...shellProps
}: Shell01Props) {
  const labels = useLabels(messages);
  const { locale } = useLocale();
  const navItems = items ?? sampleNav(locale);
  const account = user ?? sampleUser(locale);
  const searchItems = [
    ...navSearchItems(navItems, labels.pages),
    ...(commands ?? sampleCommands(locale)),
  ];

  const selectCommand = (command: SearchItem) => {
    const page = navItems.find((item) => item.id === command.id);
    if (page) {
      onNavigate?.(page);
    }
    onCommandSelect?.(command);
  };

  return (
    <AppShell
      {...shellProps}
      sidebar={
        <>
          <SidebarBrand
            logo={brand?.logo ?? <BrandMark />}
            title={brand?.title ?? labels.brand}
            subtitle={brand?.subtitle}
          />
          <SidebarContent>
            <SidebarNav
              items={navItems}
              currentPath={currentPath}
              accordion={accordion}
              onNavigate={onNavigate}
              renderLink={renderLink}
            />
          </SidebarContent>
          <SidebarFooter>
            <ShellUserMenu
              variant="sidebar"
              user={account}
              onProfile={onProfile}
              onSignOut={onSignOut}
              onLocaleChange={onLocaleChange}
              mode={mode}
              onModeChange={onModeChange}
            />
          </SidebarFooter>
        </>
      }
      topbar={
        <Topbar
          title={title}
          actions={
            <>
              {actions}
              <ShellSearch items={searchItems} onSelect={selectCommand} />
              <ShellNotifications
                notifications={notifications ?? sampleNotifications(locale)}
                onSelect={onNotificationSelect}
                onMarkAllRead={onMarkAllRead}
              />
            </>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}

export { Shell01 };
export type { Shell01Props };
