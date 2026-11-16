import { useState } from 'react';
import { AppShell } from '@/components/ui/app-shell';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { BuildingIcon, HomeIcon, InboxIcon, SettingsIcon } from '@/components/ui/icons';
import { NotificationsMenu, type NotificationItem } from '@/components/ui/notifications-menu';
import { SidebarBrand, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { SidebarTenant } from '@/components/ui/sidebar-tenant';
import { Topbar } from '@/components/ui/topbar';
import { TopbarAccount } from '@/components/ui/topbar-account';
import { TopbarLanguageMenu, TopbarThemeSwitch } from '@/components/ui/topbar-actions';
import type { Locale } from '@/lib/locale';
import type { NavItem } from '@/lib/nav-utils';
import type { ColorMode } from '@/lib/theme';
import type { Example } from '../example-types';

const items: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '#home',
    exact: true,
    icon: <HomeIcon className="size-5" />,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    href: '#inbox',
    badge: 4,
    icon: <InboxIcon className="size-5" />,
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: <SettingsIcon className="size-5" />,
    children: [
      { id: 'users', label: 'Users', href: '#users' },
      { id: 'roles', label: 'Roles', href: '#roles' },
    ],
  },
];

const notifications: NotificationItem[] = [
  { id: 'n1', title: 'Invoice 1042 was paid', description: 'Paid in full.', time: '5 min ago' },
  { id: 'n2', title: 'Stock count approved', time: 'Yesterday', read: true },
];

function Frame({ hr = false }: { hr?: boolean }) {
  const [mode, setMode] = useState<ColorMode>('light');
  const [locale, setLocale] = useState<Locale>('en');
  return (
    <div
      data-preset-scope={hr ? 'hr' : undefined}
      className="border-stroke h-[32rem] w-full overflow-hidden rounded-lg border [contain:layout]"
    >
      <AppShell
        mainId={hr ? 'hr-shell-demo-main' : 'shell-demo-main'}
        variant={hr ? 'hr' : 'default'}
        mobileBrand={
          <>
            <BuildingIcon />
            <span>SAS Suite</span>
          </>
        }
        className="h-full min-h-0 overflow-auto"
        sidebar={
          <>
            <SidebarBrand title="SAS Suite" logo={<BuildingIcon className="size-6" />} />
            <SidebarTenant label="Workspace" name="Main depot" />
            <SidebarContent>
              <SidebarNav items={items} currentPath="#home" />
            </SidebarContent>
            {hr ? null : <SidebarFooter status="All systems operational" version="v1.0.0" />}
          </>
        }
        topbar={
          <Topbar
            title="Dashboard"
            actions={
              <>
                <TopbarThemeSwitch mode={mode} onModeChange={setMode} />
                <TopbarLanguageMenu locale={locale} onLocaleChange={setLocale} />
                <NotificationsMenu notifications={notifications} />
                <TopbarAccount name="Layla Hassan" role="Operations manager">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem destructive>Sign out</DropdownMenuItem>
                </TopbarAccount>
              </>
            }
          />
        }
      >
        <p className="text-b1">
          The sidebar sits at the inline start (right in Arabic), collapses to an icon rail on
          desktop and becomes a drawer below 768px, opened from the phone header. Tab once to reveal
          the skip link.
        </p>
      </AppShell>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Shell with sidebar and topbar',
    description:
      'Resize the window or switch the docs language to see the drawer and RTL placement.',
    wide: true,
    render: () => <Frame />,
  },
  {
    title: 'HR variant',
    description:
      'A fixed column with the tenant info card and flat sections, and the 62px blurred top bar, painted by the hr preset. The shell blocks add the full page.',
    wide: true,
    render: () => <Frame hr />,
  },
];
