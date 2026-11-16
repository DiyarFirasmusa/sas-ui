import type { ReactNode } from 'react';
import { BreadcrumbTrail } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { DataBadge, type DataBadgeStatus } from '@/components/ui/data-badge';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  FileIcon,
  PlusIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { SectionTitle } from '@/components/ui/section-title';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Locale } from '@/lib/locale';

type StockStatus = 'in' | 'low' | 'out';

interface DemoCopy {
  group: string;
  title: string;
  subtitle: string;
  add: string;
  stats: readonly [string, string, string, string];
  section: string;
  columns: readonly [string, string, string, string];
  status: Record<StockStatus, string>;
  rows: readonly { code: string; name: string; warehouse: string; status: StockStatus }[];
}

const COPY: Record<Locale, DemoCopy> = {
  en: {
    group: 'Products',
    title: 'Items',
    subtitle: 'Everything you stock, with its level in each warehouse.',
    add: 'Add item',
    stats: ['All items', 'In stock', 'Low stock', 'Out of stock'],
    section: 'Latest movements',
    columns: ['Code', 'Item', 'Warehouse', 'Status'],
    status: { in: 'In stock', low: 'Low stock', out: 'Out of stock' },
    rows: [
      { code: 'ITM-1042', name: 'Copper pipe 22 mm', warehouse: 'Main depot', status: 'in' },
      { code: 'ITM-1043', name: 'Safety gloves, pair', warehouse: 'Erbil store', status: 'low' },
      { code: 'ITM-1044', name: 'Cable tie 300 mm', warehouse: 'Main depot', status: 'in' },
      { code: 'ITM-1045', name: 'Paint roller 9 in', warehouse: 'Basra store', status: 'out' },
      { code: 'ITM-1046', name: 'Wall plug 8 mm', warehouse: 'Erbil store', status: 'in' },
    ],
  },
  ar: {
    group: 'المنتجات',
    title: 'المواد',
    subtitle: 'كل ما تخزّنه مع مستواه في كل مستودع.',
    add: 'إضافة مادة',
    stats: ['كل المواد', 'متوفرة', 'مخزون منخفض', 'نفدت'],
    section: 'آخر الحركات',
    columns: ['الرمز', 'المادة', 'المستودع', 'الحالة'],
    status: { in: 'متوفرة', low: 'مخزون منخفض', out: 'نفدت' },
    rows: [
      { code: 'ITM-1042', name: 'أنبوب نحاسي 22 ملم', warehouse: 'المستودع الرئيسي', status: 'in' },
      { code: 'ITM-1043', name: 'قفازات أمان، زوج', warehouse: 'مخزن أربيل', status: 'low' },
      { code: 'ITM-1044', name: 'رباط كابلات 300 ملم', warehouse: 'المستودع الرئيسي', status: 'in' },
      { code: 'ITM-1045', name: 'بكرة طلاء 9 إنش', warehouse: 'مخزن البصرة', status: 'out' },
      { code: 'ITM-1046', name: 'مسمار حائط 8 ملم', warehouse: 'مخزن أربيل', status: 'in' },
    ],
  },
};

const TONES: Record<StockStatus, DataBadgeStatus['tone']> = {
  in: 'green',
  low: 'yellow',
  out: 'red',
};

/**
 * A page the way the dashboards compose one: breadcrumb and title with a
 * primary action, a row of KPI tiles, then one panel with a section title over
 * a table. It exists to fill the shell demos with realistic content.
 */
function ShellDemoPage({ locale }: { locale: Locale }): ReactNode {
  const copy = COPY[locale];
  const statusMap: Record<string, DataBadgeStatus> = Object.fromEntries(
    (Object.keys(TONES) as StockStatus[]).map((status) => [
      status,
      { tone: TONES[status], label: copy.status[status] },
    ]),
  );
  const icons = [<FileIcon />, <CheckCircleIcon />, <AlertTriangleIcon />, <XCircleIcon />];
  const tones = ['primary', 'success', 'warning', 'danger'] as const;
  const values = ['1,284', '1,102', '96', '86'];

  return (
    <section className="gap-card flex flex-col">
      <PageHeader
        breadcrumb={
          <BreadcrumbTrail items={[{ label: copy.group, href: '#' }, { label: copy.title }]} />
        }
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <Button>
            <PlusIcon />
            {copy.add}
          </Button>
        }
      />
      <StatGrid>
        {copy.stats.map((label, index) => (
          <StatCard
            key={label}
            label={label}
            value={values[index]}
            icon={icons[index]}
            tone={tones[index]}
          />
        ))}
      </StatGrid>
      <div className="gap-card rounded-modal border-stroke bg-surface p-panel flex flex-col border">
        <SectionTitle title={copy.section} />
        <Table>
          <TableHeader>
            <TableRow>
              {copy.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {copy.rows.map((row) => (
              <TableRow key={row.code}>
                <TableCell dir="ltr" className="text-start">
                  {row.code}
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.warehouse}</TableCell>
                <TableCell>
                  <DataBadge value={row.status} statusMap={statusMap} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export { ShellDemoPage };
