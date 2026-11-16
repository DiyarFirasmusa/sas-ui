import type {
  ActivityItem,
  ActivityTone,
  RecordRow,
  RecordStatus,
} from '@/components/blocks/dashboard-01-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DataBadgeStatus } from '@/components/ui/data-badge';
import { DataBadge } from '@/components/ui/data-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable, SkeletonText } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'activityTitle'
  | 'activityDescription'
  | 'activityEmpty'
  | 'recordsTitle'
  | 'recordsDescription'
  | 'recordsEmpty'
  | 'order'
  | 'customer'
  | 'date'
  | 'amount'
  | 'status'
  | 'paid'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'toneSuccess'
  | 'toneWarning'
  | 'toneDanger'
  | 'toneInfo'
> = {
  en: {
    activityTitle: 'Recent activity',
    activityDescription: 'What happened in the last day',
    activityEmpty: 'No activity yet',
    recordsTitle: 'Latest orders',
    recordsDescription: 'The five most recent orders',
    recordsEmpty: 'No orders yet',
    order: 'Order',
    customer: 'Customer',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded',
    toneSuccess: 'Success',
    toneWarning: 'Needs attention',
    toneDanger: 'Failed',
    toneInfo: 'Information',
  },
  ar: {
    activityTitle: 'آخر النشاطات',
    activityDescription: 'ما حدث خلال آخر يوم',
    activityEmpty: 'لا يوجد نشاط بعد',
    recordsTitle: 'أحدث الطلبات',
    recordsDescription: 'آخر خمسة طلبات',
    recordsEmpty: 'لا توجد طلبات بعد',
    order: 'الطلب',
    customer: 'العميل',
    date: 'التاريخ',
    amount: 'المبلغ',
    status: 'الحالة',
    paid: 'مدفوع',
    pending: 'قيد الانتظار',
    failed: 'فشل',
    refunded: 'مسترد',
    toneSuccess: 'نجاح',
    toneWarning: 'يحتاج انتباهاً',
    toneDanger: 'فشل',
    toneInfo: 'معلومة',
  },
};

type PanelLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

interface ActivityCardProps {
  items: readonly ActivityItem[];
  loading?: boolean;
  labels?: PanelLabels;
  className?: string;
}

/** Timeline of recent events; a skeleton while loading and an empty state for none. */
function ActivityCard({ items, loading = false, labels: overrides, className }: ActivityCardProps) {
  const labels = useLabels(messages, overrides);
  const toneLabels: Partial<Record<ActivityTone, string>> = {
    success: labels.toneSuccess,
    warning: labels.toneWarning,
    danger: labels.toneDanger,
    info: labels.toneInfo,
  };
  return (
    <Card data-slot="dashboard-activity" className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle as="h2">{labels.activityTitle}</CardTitle>
        <CardDescription>{labels.activityDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonText lines={6} />
        ) : (
          <Timeline empty={<EmptyState title={labels.activityEmpty} titleAs="p" />}>
            {items.map((item) => (
              <TimelineItem
                key={item.id}
                title={item.title}
                description={item.description}
                time={item.time}
                dateTime={item.dateTime}
                tone={item.tone}
                statusLabel={item.tone ? toneLabels[item.tone] : undefined}
              />
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
}

interface RecordsCardProps {
  records: readonly RecordRow[];
  loading?: boolean;
  /** Makes the order id a button; use it to open the record. */
  onRecordClick?: (record: RecordRow) => void;
  /** Formats the amount column. Default US dollars with Latin digits. */
  formatAmount?: (amount: number) => string;
  labels?: PanelLabels;
  className?: string;
}

/** Compact table of the latest records with a coloured status badge. */
function RecordsCard({
  records,
  loading = false,
  onRecordClick,
  formatAmount = (amount) => USD.format(amount),
  labels: overrides,
  className,
}: RecordsCardProps) {
  const labels = useLabels(messages, overrides);
  const statusMap: Record<RecordStatus, DataBadgeStatus> = {
    paid: { tone: 'green', label: labels.paid },
    pending: { tone: 'yellow', label: labels.pending },
    failed: { tone: 'red', label: labels.failed },
    refunded: { tone: 'neutral', label: labels.refunded },
  };
  return (
    <Card data-slot="dashboard-records" className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle as="h2">{labels.recordsTitle}</CardTitle>
        <CardDescription>{labels.recordsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : records.length === 0 ? (
          <EmptyState title={labels.recordsEmpty} titleAs="p" />
        ) : (
          <Table>
            <TableCaption className="sr-only">{labels.recordsTitle}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.order}</TableHead>
                <TableHead>{labels.customer}</TableHead>
                <TableHead>{labels.date}</TableHead>
                <TableHead numeric>{labels.amount}</TableHead>
                <TableHead>{labels.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {onRecordClick ? (
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="px-0"
                        onClick={() => onRecordClick(record)}
                      >
                        <span dir="ltr">{record.id}</span>
                      </Button>
                    ) : (
                      <span dir="ltr">{record.id}</span>
                    )}
                  </TableCell>
                  <TableCell dir="auto">{record.customer}</TableCell>
                  <TableCell className="text-text-secondary whitespace-nowrap">
                    {record.date}
                  </TableCell>
                  <TableCell numeric>
                    <span dir="ltr">{formatAmount(record.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <DataBadge value={record.status} statusMap={statusMap} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export { ActivityCard, RecordsCard };
export type { ActivityCardProps, RecordsCardProps };
