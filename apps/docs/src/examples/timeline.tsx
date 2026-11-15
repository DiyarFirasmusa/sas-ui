import { CheckIcon, CloseIcon, FileIcon } from '@/components/ui/icons';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Order history',
    render: () => (
      <Timeline aria-label="Order history" className="max-w-md">
        <TimelineItem
          title="Order placed"
          time="Mon 09:00"
          description="By Layla Hassan"
          icon={<FileIcon />}
          tone="primary"
        />
        <TimelineItem
          title="Payment received"
          time="Mon 09:12"
          icon={<CheckIcon />}
          tone="success"
          statusLabel="Done"
        />
        <TimelineItem
          title="Delivery failed"
          time="Tue 14:30"
          description="Nobody was at the address."
          icon={<CloseIcon />}
          tone="danger"
          statusLabel="Failed"
        />
        <TimelineItem title="Rescheduled" time="Wed 10:00" />
      </Timeline>
    ),
  },
  {
    title: 'Arabic',
    render: () => (
      <Timeline aria-label="سجل الطلب" className="max-w-md">
        <TimelineItem
          title="تم إنشاء الطلب"
          time="الاثنين 09:00"
          description="بواسطة ليلى حسن"
          tone="primary"
        />
        <TimelineItem
          title="تم استلام الدفع"
          time="الاثنين 09:12"
          icon={<CheckIcon />}
          tone="success"
        />
      </Timeline>
    ),
  },
  {
    title: 'Empty',
    render: () => (
      <Timeline empty={<p className="text-b2 text-text-muted">No activity yet.</p>}>{[]}</Timeline>
    ),
  },
];
