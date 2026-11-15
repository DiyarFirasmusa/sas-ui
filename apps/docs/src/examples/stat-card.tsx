import { UserIcon, FileIcon, ClockIcon, CheckCircleIcon } from '@/components/ui/icons';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Grid of KPIs',
    wide: true,
    render: () => (
      <StatGrid>
        <StatCard label="Revenue" value="124,500" delta={{ value: '12%', trend: 'up', caption: 'vs last month' }} icon={<FileIcon />} tone="primary" />
        <StatCard label="New clients" value={48} delta={{ value: '3%', trend: 'down' }} icon={<UserIcon />} tone="info" />
        <StatCard label="Avg. response time" value="2.4h" delta={{ value: '8%', trend: 'down', tone: 'positive' }} icon={<ClockIcon />} tone="warning" />
        <StatCard label="Completed" value="1,204" delta={{ value: '0%', trend: 'neutral' }} icon={<CheckCircleIcon />} tone="success" />
      </StatGrid>
    ),
  },
  {
    title: 'Loading',
    render: () => <StatCard label="Revenue" loading delta={{ value: '', trend: 'up' }} icon={<FileIcon />} />,
  },
  {
    title: 'Interactive',
    description: 'href renders a link, onClick a button; both get hover and focus styles.',
    render: () => (
      <div className="grid gap-row sm:grid-cols-2">
        <StatCard label="Overdue invoices" value={7} tone="danger" icon={<FileIcon />} href="#overdue" />
        <StatCard label="Open tasks" value={23} onClick={() => {}} />
      </div>
    ),
  },
  {
    title: 'Arabic',
    render: () => <StatCard label="الإيرادات" value="124,500" delta={{ value: '12%', trend: 'up', caption: 'مقارنة بالشهر الماضي' }} icon={<FileIcon />} />,
  },
];
