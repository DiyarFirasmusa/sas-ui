import { useState } from 'react';
import { Shell02 } from '@/components/blocks/shell-02';
import type { ShellRenderLink } from '@/components/blocks/shell-top-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import type { ColorMode } from '@/lib/theme';
import type { Example } from '../example-types';

/** Keeps the demo inside the preview: a real app hands `props` to its router's Link instead. */
const renderLink: ShellRenderLink = ({ onClick, ...props }) => (
  <a
    {...props}
    onClick={(event) => {
      event.preventDefault();
      onClick?.(event);
    }}
  />
);

function Shell02Demo() {
  const [path, setPath] = useState('/customers');
  const [mode, setMode] = useState<ColorMode>('system');
  return (
    <Shell02
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
                Groups in the top menu open dropdowns; on a phone they move into the menu sheet.
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell02>
  );
}

export const examples: Example[] = [
  {
    fullBleed: true,
    title: 'Top navigation layout',
    description:
      'No sidebar: brand, horizontal menu with dropdown submenus, search, notifications, account menu and a centred page container. Below lg the menu becomes a hamburger sheet.',
    wide: true,
    render: () => <Shell02Demo />,
  },
];
