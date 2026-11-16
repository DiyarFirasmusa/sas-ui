import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blocks } from '../catalog';
import { BlockView } from './block-view';

const CATEGORIES: { id: string; label: string; names: readonly string[] }[] = [
  {
    id: 'featured',
    label: 'Featured',
    names: ['dashboard-01', 'shell-01', 'list-page-01', 'login-02'],
  },
  { id: 'dashboard', label: 'Dashboard', names: ['dashboard-01', 'approval-01'] },
  {
    id: 'pages',
    label: 'Pages',
    names: ['list-page-01', 'detail-page-01', 'form-page-01', 'wizard-01', 'settings-01'],
  },
  { id: 'layout', label: 'Layouts', names: ['shell-01', 'shell-02'] },
  { id: 'auth', label: 'Sign in', names: ['login-01', 'login-02'] },
  { id: 'errors', label: 'Errors', names: ['error-page-01'] },
];

/** The Blocks gallery: hero, category tabs, then each block as a live responsive preview. */
export function BlocksPage() {
  const [category, setCategory] = useState('featured');
  const current = CATEGORIES.find((entry) => entry.id === category) ?? CATEGORIES[0];
  const visible = (current?.names ?? [])
    .map((name) => blocks.find((block) => block.name === name))
    .filter((block) => block !== undefined);
  return (
    <div className="gap-card mx-auto flex max-w-6xl flex-col">
      <header className="gap-field py-card flex flex-col items-center text-center">
        <h1 className="text-h1 text-text-primary text-balance md:text-[2.75rem] md:leading-tight">
          Building blocks for dashboards
        </h1>
        <p className="text-b1 text-text-secondary max-w-2xl">
          Whole pages composed from the library — sign-in, shells, dashboards, lists, details,
          forms. Right-to-left first, copy them in and edit.
        </p>
        <div className="gap-field flex">
          <Button render={<a href="#/docs/installation" />} nativeButton={false}>
            Get started
          </Button>
          <Button variant="outline" render={<a href="#/components" />} nativeButton={false}>
            View components
          </Button>
        </div>
      </header>

      <Tabs value={category} onValueChange={setCategory} variant="underline">
        <TabsList aria-label="Block categories">
          {CATEGORIES.map((entry) => (
            <TabsTrigger key={entry.id} value={entry.id}>
              {entry.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="gap-card flex flex-col">
        {visible.map((block) => (
          <BlockView key={`${category}-${block.name}`} block={block} />
        ))}
      </div>
    </div>
  );
}
