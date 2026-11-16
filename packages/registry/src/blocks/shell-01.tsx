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
  sampleWorkspace,
} from '@/components/blocks/shell-sample';
import { navSearchItems, ShellSearch, type SearchItem } from '@/components/blocks/shell-search';
import { ShellUserMenu, type ShellUser } from '@/components/blocks/shell-user-menu';
import { AppShell, type AppShellProps } from '@/components/ui/app-shell';
import { BuildingIcon } from '@/components/ui/icons';
import { SidebarBrand, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav, type RenderNavLink } from '@/components/ui/sidebar-nav';
import { SidebarTenant } from '@/components/ui/sidebar-tenant';
import { Topbar, type TopbarVariant } from '@/components/ui/topbar';
import { TopbarLanguageMenu, TopbarThemeSwitch } from '@/components/ui/topbar-actions';
import { useLabels, useLocale, type Locale, type Messages } from '@/lib/locale';
import type { NavItem } from '@/lib/nav-utils';
import type { ColorMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

const messages: Messages<'brand' | 'pages'> = {
  en: { brand: 'SAS Suite', pages: 'Pages' },
  ar: { brand: 'حزمة ساس', pages: 'الصفحات' },
};

/** Default logo: a bare glyph in the sidebar's text colour, as in the dashboards. */
function BrandMark() {
  return <BuildingIcon className="size-6" />;
}

/** Search trigger dressed for the bar it sits in: a translucent veil on the sidebar-coloured bar. */
function searchClass(look: TopbarVariant): string {
  return cn(
    look === 'sidebar' &&
      'border-transparent bg-sidebar-foreground/8 text-sidebar-foreground/70 hover:bg-sidebar-foreground/16 hover:text-sidebar-foreground',
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
  /**
   * The workspace, warehouse or tenant under the brand: a tinted card (the HR
   * layout shows the info card). `false` leaves it out.
   */
  workspace?: { label: string; name: string; detail?: string; icon?: ReactNode } | false;
  /** Status line of the sidebar footer; `false` hides it. Not shown in the `hr` layout. */
  status?: string | false;
  /** Version shown at the end of the status line. */
  version?: string;
  user?: ShellUser;
  /**
   * Where the account menu lives: the top bar, as in the dashboards, or a
   * block at the bottom of the sidebar. With the `hr` variant the sidebar
   * block also appears in the phone drawer, where the top bar is hidden.
   */
  userPlacement?: 'topbar' | 'sidebar';
  onProfile?: () => void;
  onSignOut?: () => void;
  /** Shows the language control of the top bar when set. */
  onLocaleChange?: (locale: Locale) => void;
  mode?: ColorMode;
  /** Shows the theme switch of the top bar when set. */
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
  /** Look of the top bar; by default it follows `variant`. */
  topbarVariant?: TopbarVariant;
  children: ReactNode;
}

/**
 * The dashboards' application layout: a collapsible sidebar (brand, workspace
 * card, grouped accordion navigation with icons, status footer; a drawer on
 * phones) and a top bar with title, command palette (⌘K / Ctrl+K), theme and
 * language controls, a notification bell and the account chip. `variant="hr"`
 * switches to the HR structure: fixed column, tenant info card, flat sections.
 * `children` is the page. Every list and handler is a prop with a sample
 * default.
 */
function Shell01({
  items,
  currentPath,
  accordion = true,
  onNavigate,
  renderLink,
  brand,
  workspace,
  status,
  version,
  user,
  userPlacement = 'topbar',
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
  topbarVariant,
  variant = 'default',
  mobileBrand,
  children,
  ...shellProps
}: Shell01Props) {
  const labels = useLabels(messages);
  const { locale } = useLocale();
  const hr = variant === 'hr';
  const look = topbarVariant ?? (hr ? 'hr' : 'sidebar');
  const navItems = items ?? sampleNav(locale);
  const account = user ?? sampleUser(locale);
  const sample = sampleWorkspace(locale);
  const tenant = workspace === undefined ? sample : workspace;
  const statusText = status === undefined ? sample.status : status;
  const searchItems = [
    ...navSearchItems(navItems, labels.pages),
    ...(commands ?? sampleCommands(locale)),
  ];
  const brandTitle = brand?.title ?? labels.brand;
  const mark = brand?.logo ?? <BrandMark />;
  const userInSidebar = userPlacement === 'sidebar';

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
      variant={variant}
      mobileBrand={
        mobileBrand ?? (
          <>
            {mark}
            <span dir="auto" className="truncate">
              {brandTitle}
            </span>
          </>
        )
      }
      sidebar={
        <>
          <SidebarBrand logo={mark} title={brandTitle} subtitle={brand?.subtitle} />
          {tenant === false ? null : <SidebarTenant {...tenant} />}
          <SidebarContent>
            <SidebarNav
              items={navItems}
              currentPath={currentPath}
              accordion={accordion}
              onNavigate={onNavigate}
              renderLink={renderLink}
            />
          </SidebarContent>
          <SidebarFooter
            status={hr || statusText === false ? undefined : statusText}
            version={version}
            className="empty:hidden"
          >
            {userInSidebar || hr ? (
              <ShellUserMenu
                variant="sidebar"
                user={account}
                drawerOnly={!userInSidebar}
                onProfile={onProfile}
                onSignOut={onSignOut}
                // The phone drawer has no top bar in the HR layout, so it carries these entries.
                onLocaleChange={hr ? onLocaleChange : undefined}
                mode={mode}
                onModeChange={hr ? onModeChange : undefined}
              />
            ) : null}
          </SidebarFooter>
        </>
      }
      topbar={
        <Topbar
          variant={look}
          title={title}
          actions={
            <>
              {actions}
              <ShellSearch
                items={searchItems}
                onSelect={selectCommand}
                className={searchClass(look)}
              />
              {onModeChange ? (
                <TopbarThemeSwitch mode={mode ?? 'system'} onModeChange={onModeChange} />
              ) : null}
              {onLocaleChange ? (
                <TopbarLanguageMenu locale={locale} onLocaleChange={onLocaleChange} />
              ) : null}
              <ShellNotifications
                notifications={notifications ?? sampleNotifications(locale)}
                onSelect={onNotificationSelect}
                onMarkAllRead={onMarkAllRead}
              />
              {userInSidebar ? null : (
                <ShellUserMenu
                  variant="topbar"
                  user={account}
                  onProfile={onProfile}
                  onSignOut={onSignOut}
                />
              )}
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
