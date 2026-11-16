import { useState } from 'react';
import { Shell01 } from '@/components/blocks/shell-01';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import type { RenderNavLink } from '@/components/ui/sidebar-nav';
import type { ColorMode } from '@/lib/theme';
import type { Example } from '../example-types';

/** Keeps the demo inside the preview: a real app hands `props` to its router's Link instead. */
const renderLink: RenderNavLink = ({ children, onClick, ...props }) => (
  <a
    {...props}
    onClick={(event) => {
      event.preventDefault();
      onClick?.(event);
    }}
  >
    {children}
  </a>
);

function Shell01Demo() {
  const [path, setPath] = useState('/customers');
  const [mode, setMode] = useState<ColorMode>('system');
  return (
    <Shell01
      title="Customers"
      currentPath={path}
      renderLink={renderLink}
      onNavigate={(item) => {
        if (item.href) {
          setPath(item.href);
        }
      }}
      mode={mode}
      onModeChange={setMode}
      onProfile={() => {}}
      onSignOut={() => {}}
    >
      <div className="gap-card flex flex-col">
        <PageHeader
          title="Customers"
          subtitle="People and companies you invoice"
          actions={<Button>New customer</Button>}
        />
        <div className="gap-row grid sm:grid-cols-2 lg:grid-cols-3">
          {['Northwind Trading', 'Blue Harbor', 'Acme Supplies'].map((name) => (
            <Card key={name}>
              <CardHeader>
                <CardTitle as="h2">{name}</CardTitle>
                <CardDescription>Active since 2024</CardDescription>
              </CardHeader>
              <CardContent className="text-b2 text-text-secondary">
                Press Ctrl+K (or ⌘K) to search pages and actions.
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell01>
  );
}

export const examples: Example[] = [
  {
    fullBleed: true,
    title: 'Sidebar layout',
    description:
      'Collapsible sidebar (a drawer on phones), account menu, topbar with title slot, command palette and notifications. Everything is a prop with a sample default.',
    wide: true,
    render: () => <Shell01Demo />,
  },
];
