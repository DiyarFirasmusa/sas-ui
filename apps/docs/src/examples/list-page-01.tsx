import { ListPage01 } from '@/components/blocks/list-page-01';
import type { Example } from '../example-types';

const noop = () => {};

export const examples: Example[] = [
  {
    title: 'Licences',
    description:
      'Search, filters, sorting and paging run against the built-in sample set; pass `rows`, `total` and `query` to drive it from your API.',
    wide: true,
    render: () => (
      <ListPage01
        onCreate={noop}
        onView={noop}
        onRenew={noop}
        onExport={noop}
        onSuspend={async () => {}}
      />
    ),
  },
  { title: 'Loading', wide: true, render: () => <ListPage01 status="loading" /> },
  {
    title: 'Error',
    wide: true,
    render: () => <ListPage01 status="error" onRetry={noop} />,
  },
  {
    title: 'Empty',
    wide: true,
    render: () => <ListPage01 rows={[]} total={0} onCreate={noop} />,
  },
];
