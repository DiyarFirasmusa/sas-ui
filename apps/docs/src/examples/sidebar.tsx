import { useState } from 'react';
import { BuildingIcon, HomeIcon, InboxIcon, SettingsIcon, UserIcon } from '@/components/ui/icons';
import { Sidebar, SidebarBrand, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { filterNavItems, type NavItem } from '@/lib/nav-utils';
import type { Example } from '../example-types';

const icon = 'size-5';

const items: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    exact: true,
    icon: <HomeIcon className={icon} />,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    href: '/inbox',
    badge: 12,
    icon: <InboxIcon className={icon} />,
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <BuildingIcon className={icon} />,
    children: [
      { id: 'orders', label: 'Orders', href: '/sales/orders', badge: 3 },
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/sales/invoices',
        matches: ['/billing'],
      },
      { id: 'quotes', label: 'Quotes', href: '/sales/quotes', disabled: true },
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: <UserIcon className={icon} />,
    children: [{ id: 'staff', label: 'Staff', href: '/people/staff' }],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <SettingsIcon className={icon} />,
  },
];

function Demo({ rail = false, arabic = false }: { rail?: boolean; arabic?: boolean }) {
  const [path, setPath] = useState('/sales/orders');
  const data = arabic
    ? items.map((item) => ({
        ...item,
        label:
          {
            Home: 'الرئيسية',
            Inbox: 'الوارد',
            Sales: 'المبيعات',
            People: 'الأشخاص',
            Settings: 'الإعدادات',
          }[item.label] ?? item.label,
      }))
    : items;
  return (
    <div className="border-stroke flex h-96 overflow-hidden rounded-lg border">
      <Sidebar collapsed={rail} className="h-full">
        <SidebarBrand
          title="SAS Suite"
          subtitle="Admin"
          logo={<BuildingIcon className="size-6" />}
        />
        <SidebarContent>
          <SidebarNav
            items={data}
            currentPath={path}
            renderLink={({ children, ...props }) => (
              <a
                {...props}
                onClick={(event) => {
                  event.preventDefault();
                  setPath(props.href);
                  props.onClick?.(event);
                }}
              >
                {children}
              </a>
            )}
          />
        </SidebarContent>
        <SidebarFooter>
          <p className="text-b3 truncate">v1.0</p>
        </SidebarFooter>
      </Sidebar>
      <div className="p-row text-b2 text-text-muted flex-1">Current path: {path}</div>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Data-driven navigation',
    description:
      'Groups open around the active page, badges cap at 99+, disabled items are not links. renderLink lets any router draw the links.',
    wide: true,
    render: () => <Demo />,
  },
  {
    title: 'Icon rail',
    wide: true,
    render: () => <Demo rail />,
  },
  {
    title: 'Arabic labels',
    description: 'Switch the docs locale to Arabic to see the sidebar sit at the right edge.',
    wide: true,
    render: () => <Demo arabic />,
  },
  {
    title: 'Permission filtering',
    description: 'filterNavItems() prunes items the caller rejects and groups left empty.',
    wide: true,
    render: () => {
      const visible = filterNavItems(
        items,
        (item) => item.id !== 'staff' && item.id !== 'settings',
      );
      return (
        <Sidebar className="h-72 rounded-lg border">
          <SidebarContent>
            <SidebarNav items={visible} currentPath="/" />
          </SidebarContent>
        </Sidebar>
      );
    },
  },
];
