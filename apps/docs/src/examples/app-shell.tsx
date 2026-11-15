import { AppShell } from '@/components/ui/app-shell';
import { Button } from '@/components/ui/button';
import { BuildingIcon, HomeIcon, InboxIcon, SettingsIcon } from '@/components/ui/icons';
import { SidebarBrand, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { Topbar } from '@/components/ui/topbar';
import type { NavItem } from '@/lib/nav-utils';
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

function Frame() {
  return (
    <div className="border-stroke h-[28rem] w-full overflow-hidden rounded-lg border [contain:layout]">
      <AppShell
        mainId="shell-demo-main"
        className="h-full min-h-0 overflow-auto"
        sidebar={
          <>
            <SidebarBrand title="SAS Suite" logo={<BuildingIcon className="size-6" />} />
            <SidebarContent>
              <SidebarNav items={items} currentPath="#home" />
            </SidebarContent>
            <SidebarFooter>
              <p className="text-b3 truncate">Signed in as Layla</p>
            </SidebarFooter>
          </>
        }
        topbar={
          <Topbar
            title="Dashboard"
            actions={
              <Button variant="outline" size="sm">
                New
              </Button>
            }
          />
        }
      >
        <p className="text-b1">
          The sidebar sits at the inline start (right in Arabic), collapses to an icon rail on
          desktop and becomes a drawer below 768px, opened from the topbar menu button. Tab once to
          reveal the skip link.
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
];
