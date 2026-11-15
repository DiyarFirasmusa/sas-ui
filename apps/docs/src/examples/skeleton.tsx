import { Skeleton, SkeletonTable, SkeletonText } from '@/components/ui/skeleton';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Block',
    render: () => (
      <div className="gap-inline flex items-center">
        <Skeleton className="rounded-pill size-12" />
        <div className="gap-field flex flex-col">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ),
  },
  {
    title: 'Text lines',
    render: () => <SkeletonText lines={4} />,
  },
  {
    title: 'Table rows',
    wide: true,
    render: () => <SkeletonTable rows={4} columns={4} label="Loading invoices" />,
  },
];
