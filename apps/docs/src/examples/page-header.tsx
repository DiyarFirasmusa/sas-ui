import { Button } from '@/components/ui/button';
import { DataBadge } from '@/components/ui/data-badge';
import { PageHeader } from '@/components/ui/page-header';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Title, subtitle and actions',
    render: () => (
      <PageHeader
        title="Invoices"
        subtitle="All billing documents for your organisation"
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>New invoice</Button>
          </>
        }
      />
    ),
  },
  {
    title: 'Back button and badge',
    description: 'The back arrow points to the start edge: left in English, right in Arabic.',
    render: () => (
      <PageHeader
        title="Invoice 1042"
        subtitle="Issued on 12 March"
        badge={<DataBadge value="PAID" statusMap={{ PAID: { tone: 'green', label: 'Paid' } }} />}
        onBack={() => {}}
        breadcrumb={<span className="text-b3 text-text-muted">Invoices / 1042</span>}
        actions={<Button variant="outline">Download</Button>}
      />
    ),
  },
  {
    title: 'Sticky',
    description: 'Pins to the top of the nearest scroll container.',
    render: () => (
      <div className="border-stroke bg-background px-row h-48 overflow-auto rounded-xl border">
        <PageHeader sticky title="Reports" actions={<Button size="sm">Refresh</Button>} />
        <div className="py-row text-b2 text-text-secondary h-96">
          Scroll to see the header stay in place.
        </div>
      </div>
    ),
  },
  {
    title: 'Arabic',
    render: () => (
      <PageHeader
        title="الفواتير"
        subtitle="جميع مستندات الفوترة"
        onBack={() => {}}
        actions={<Button>فاتورة جديدة</Button>}
      />
    ),
  },
];
