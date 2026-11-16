import { Dashboard01 } from '@/components/blocks/dashboard-01';
import { Button } from '@/components/ui/button';
import type { Example } from '../example-types';

const noop = () => {};

export const examples: Example[] = [
  {
    title: 'Overview',
    description:
      'Sample data in both languages. Pass `stats`, `revenue`, `categories`, `activity` and `records` from your API; the revenue range, loading, empty and error states are props.',
    wide: true,
    render: () => (
      <Dashboard01 actions={<Button variant="outline">Export</Button>} onRecordClick={noop} />
    ),
  },
  { title: 'Loading', wide: true, render: () => <Dashboard01 loading /> },
  {
    title: 'Empty',
    wide: true,
    render: () => (
      <Dashboard01 stats={[]} revenue={[]} categories={[]} activity={[]} records={[]} />
    ),
  },
  {
    title: 'Error',
    wide: true,
    render: () => <Dashboard01 error="HTTP 503" onRetry={noop} />,
  },
];
