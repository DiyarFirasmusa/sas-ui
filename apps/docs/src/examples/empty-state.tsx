import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Default',
    render: () => (
      <EmptyState
        title="No invoices yet"
        description="Create your first invoice to start tracking payments."
        actions={<Button>New invoice</Button>}
      />
    ),
  },
  {
    title: 'No results',
    description: 'The search/filter preset with localized wording.',
    render: () => (
      <EmptyState preset="no-results" actions={<Button variant="outline">Clear filters</Button>} />
    ),
  },
  {
    title: 'Page size',
    render: () => (
      <EmptyState
        size="page"
        title="Your inbox is empty"
        description="New messages will show up here."
      />
    ),
  },
  {
    title: 'Arabic',
    render: () => (
      <EmptyState
        title="لا توجد فواتير بعد"
        description="أنشئ أول فاتورة لبدء تتبع المدفوعات."
        actions={<Button>فاتورة جديدة</Button>}
      />
    ),
  },
];
