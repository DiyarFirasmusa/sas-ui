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
    title: 'Pulse',
    description:
      'Blocks shimmer by default (a highlight sweeps across); pass `shimmer={false}` to pulse. Reduced motion stops both.',
    render: () => (
      <div className="gap-row flex w-full max-w-sm flex-col">
        <div className="gap-inline flex items-center">
          <Skeleton shimmer={false} className="rounded-pill size-12" />
          <div className="gap-field flex flex-col">
            <Skeleton shimmer={false} className="h-4 w-40" />
            <Skeleton shimmer={false} className="h-3 w-24" />
          </div>
        </div>
        <SkeletonText lines={3} shimmer={false} />
      </div>
    ),
  },
  {
    title: 'Table rows',
    wide: true,
    render: () => <SkeletonTable rows={4} columns={4} label="Loading invoices" />,
  },
];
