import { useId, useState } from 'react';
import { TabBar, TabPanel, type TabBarItem } from '@/components/ui/tab-bar';
import type { Example } from '../example-types';

type Section = 'all' | 'pending' | 'done' | 'archived';

const sections: TabBarItem<Section>[] = [
  { id: 'all', label: 'All', count: 24 },
  { id: 'pending', label: 'Pending', count: 8 },
  { id: 'done', label: 'Done' },
  { id: 'archived', label: 'Archived', disabled: true },
];

const bodies: Record<Section, string> = {
  all: 'Every request, newest first.',
  pending: 'Requests waiting for a decision.',
  done: 'Requests that were completed.',
  archived: 'Older requests.',
};

function Demo({ variant, fill }: { variant: 'pill' | 'plain' | 'underline'; fill?: boolean }) {
  const [value, setValue] = useState<Section>('pending');
  const prefix = useId();
  return (
    <div className="gap-row flex w-full max-w-lg flex-col">
      <TabBar
        items={sections}
        value={value}
        onValueChange={setValue}
        variant={variant}
        fill={fill}
        idPrefix={prefix}
        aria-label={`Requests (${variant})`}
      />
      <div className="text-b1 text-text-secondary">
        {/* Panels are separate components: they can live anywhere on the page. */}
        {(Object.keys(bodies) as Section[]).map((id) => (
          <TabPanel key={id} active={value === id} value={id} idPrefix={prefix}>
            {bodies[id]}
          </TabPanel>
        ))}
      </div>
    </div>
  );
}

function FilterOnly() {
  const [value, setValue] = useState<Section>('all');
  return (
    <TabBar
      items={sections.slice(0, 3)}
      value={value}
      onValueChange={setValue}
      aria-label="Filter requests"
    />
  );
}

export const examples: Example[] = [
  {
    title: 'Pill with counts',
    description:
      'Arrow keys move and select (mirrored in Arabic), Home/End jump to the ends, disabled tabs are skipped. The panel is a separate component linked by id.',
    render: () => <Demo variant="pill" />,
  },
  {
    title: 'Pill, filled',
    description: '`fill` shares the track width evenly, for narrow screens.',
    render: () => <Demo variant="pill" fill />,
  },
  { title: 'Plain', render: () => <Demo variant="plain" /> },
  { title: 'Underline', render: () => <Demo variant="underline" /> },
  {
    title: 'As a filter (no panels)',
    description:
      'aria-controls is only set when a matching panel exists on the page, so a bar used as a filter stays valid.',
    render: () => <FilterOnly />,
  },
];
