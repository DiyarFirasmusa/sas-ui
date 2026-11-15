import { DataBadge, type DataBadgeStatus } from '@/components/ui/data-badge';
import type { Example } from '../example-types';

const statusMap: Record<string, DataBadgeStatus> = {
  PAID: { tone: 'green', label: 'Paid' },
  PENDING: { tone: 'yellow', label: 'Pending' },
  OVERDUE: { tone: 'red', label: 'Overdue' },
  REVIEW: { tone: 'blue', label: 'In review' },
};

export const examples: Example[] = [
  {
    title: 'Status map',
    description: 'Each backend value resolves to a tone and a label.',
    render: () => (
      <div className="flex flex-wrap gap-field">
        {Object.keys(statusMap).map((value) => (
          <DataBadge key={value} value={value} statusMap={statusMap} />
        ))}
      </div>
    ),
  },
  {
    title: 'Unknown and empty values',
    description: 'A value the map does not know shows as a neutral badge with the raw value.',
    render: () => (
      <div className="flex flex-wrap gap-field">
        <DataBadge value="ARCHIVED" statusMap={statusMap} />
        <DataBadge value={null} statusMap={statusMap} />
      </div>
    ),
  },
  {
    title: 'Arabic labels',
    render: () => (
      <div className="flex flex-wrap gap-field">
        <DataBadge value="PAID" statusMap={{ PAID: { tone: 'green', label: 'مدفوع' } }} />
        <DataBadge value="OVERDUE" statusMap={{ OVERDUE: { tone: 'red', label: 'متأخر' } }} />
      </div>
    ),
  },
];
