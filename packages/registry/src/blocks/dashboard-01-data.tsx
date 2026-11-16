import type { ReactNode } from 'react';
import { TrendingUpIcon } from '@/components/blocks/block-icons';
import type { ChartRow, ChartTrend } from '@/components/blocks/chart-data';
import { AlertTriangleIcon, FileIcon, UserIcon } from '@/components/ui/icons';
import type { StatCardProps } from '@/components/ui/stat-card';
import type { Locale } from '@/lib/locale';

type DashboardRange = '7d' | '30d' | '90d';

const DASHBOARD_RANGES: readonly DashboardRange[] = ['7d', '30d', '90d'];
const RANGE_DAYS: Record<DashboardRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

type RecordStatus = 'paid' | 'pending' | 'failed' | 'refunded';
type ActivityTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface DashboardStat {
  id: string;
  label: string;
  /** The figure as it should read, e.g. `$48,250`. */
  value: string;
  delta?: StatCardProps['delta'];
  icon?: ReactNode;
  tone?: StatCardProps['tone'];
}

/** One day of revenue, oldest first. `label` is the already-formatted date shown on the axis. */
interface RevenuePoint {
  label: string;
  revenue: number;
}

interface CategoryPoint {
  category: string;
  sales: number;
  returns: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  /** Display time such as "10:30" or "Yesterday". */
  time: string;
  dateTime?: string;
  tone?: ActivityTone;
}

interface RecordRow {
  id: string;
  customer: string;
  amount: number;
  status: RecordStatus;
  /** Display date. */
  date: string;
}

interface DashboardSample {
  stats: DashboardStat[];
  revenue: RevenuePoint[];
  categories: CategoryPoint[];
  activity: ActivityItem[];
  records: RecordRow[];
}

/** The last `range` days, shaped for the chart. */
function revenueRows(points: readonly RevenuePoint[], range: DashboardRange): ChartRow[] {
  return points.slice(-RANGE_DAYS[range]).map((point) => ({
    label: point.label,
    revenue: point.revenue,
  }));
}

/**
 * Change of the selected period against the one before it. Null when the data
 * does not reach back far enough or the earlier period earned nothing.
 */
function periodChange(
  points: readonly RevenuePoint[],
  range: DashboardRange,
): { percent: number; direction: ChartTrend['direction'] } | null {
  const days = RANGE_DAYS[range];
  if (points.length < days * 2) {
    return null;
  }
  const sum = (slice: readonly RevenuePoint[]) =>
    slice.reduce((total, point) => total + point.revenue, 0);
  const current = sum(points.slice(-days));
  const previous = sum(points.slice(-days * 2, -days));
  if (previous <= 0) {
    return null;
  }
  const percent = Math.round(((current - previous) / previous) * 1000) / 10;
  return {
    percent: Math.abs(percent),
    direction: percent === 0 ? 'flat' : percent > 0 ? 'up' : 'down',
  };
}

const ANCHOR = Date.UTC(2026, 10, 16);
const DAY = 86_400_000;
const SAMPLE_DAYS = 180;

function sampleRevenue(locale: Locale): RevenuePoint[] {
  const format = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : 'en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return Array.from({ length: SAMPLE_DAYS }, (_, index) => {
    const age = SAMPLE_DAYS - 1 - index;
    const weekend = index % 7 === 5 || index % 7 === 6;
    const revenue = Math.round(1400 + index * 9 + 380 * Math.sin(index / 5) - (weekend ? 320 : 0));
    return { label: format.format(new Date(ANCHOR - age * DAY)), revenue };
  });
}

interface Copy {
  stats: readonly [string, string, string, string];
  caption: string;
  categories: readonly [string, string, string, string, string];
  activity: readonly { title: string; description: string; time: string }[];
  customers: readonly string[];
  dates: readonly [string, string, string, string, string];
}

const COPY: Record<Locale, Copy> = {
  en: {
    stats: ['Revenue', 'Orders', 'New customers', 'Refund rate'],
    caption: 'vs last 30 days',
    categories: ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports'],
    activity: [
      { title: 'Order #4821 paid', description: 'Northwind Trading, $1,240', time: '10:30' },
      { title: 'Refund requested', description: 'Order #4790 by Adel Mansour', time: '09:12' },
      { title: 'Payment failed', description: 'Card declined for order #4815', time: 'Yesterday' },
      { title: 'New customer', description: 'Salma Ibrahim signed up', time: 'Yesterday' },
    ],
    customers: [
      'Northwind Trading',
      'Adel Mansour',
      'Salma Ibrahim',
      'Blue Harbor Ltd',
      'Rana Khoury',
    ],
    dates: ['Nov 16', 'Nov 15', 'Nov 15', 'Nov 14', 'Nov 13'],
  },
  ar: {
    stats: ['الإيرادات', 'الطلبات', 'عملاء جدد', 'نسبة الاسترداد'],
    caption: 'مقارنة بآخر 30 يوماً',
    categories: ['الإلكترونيات', 'الملابس', 'المنزل', 'التجميل', 'الرياضة'],
    activity: [
      { title: 'تم دفع الطلب #4821', description: 'شركة الشمال للتجارة، $1,240', time: '10:30' },
      { title: 'طلب استرداد', description: 'الطلب #4790 من عادل منصور', time: '09:12' },
      { title: 'فشلت عملية الدفع', description: 'رُفضت البطاقة للطلب #4815', time: 'أمس' },
      { title: 'عميل جديد', description: 'سجّلت سلمى إبراهيم حساباً', time: 'أمس' },
    ],
    customers: ['شركة الشمال للتجارة', 'عادل منصور', 'سلمى إبراهيم', 'مرفأ الأزرق', 'رنا خوري'],
    dates: ['16 نوفمبر', '15 نوفمبر', '15 نوفمبر', '14 نوفمبر', '13 نوفمبر'],
  },
};

const ACTIVITY_TONES: readonly ActivityTone[] = ['success', 'warning', 'danger', 'info'];
const RECORD_STATUSES: readonly RecordStatus[] = ['paid', 'pending', 'failed', 'paid', 'refunded'];
const AMOUNTS = [1240, 860, 2150, 430, 975];
const SALES = [4200, 3100, 2800, 1900, 1500];
const RETURNS = [320, 410, 150, 90, 120];

/** Sample content for `Dashboard01`, written in both languages. Replace with your data. */
function dashboardSample(locale: Locale): DashboardSample {
  const copy = COPY[locale];
  const deltas: StatCardProps['delta'][] = [
    { value: '12.5%', trend: 'up', caption: copy.caption },
    { value: '4.3%', trend: 'up', caption: copy.caption },
    { value: '2.1%', trend: 'down', caption: copy.caption },
    { value: '0.4%', trend: 'down', tone: 'positive', caption: copy.caption },
  ];
  const values = ['$48,250', '1,284', '892', '1.8%'];
  const icons: ReactNode[] = [
    <TrendingUpIcon />,
    <FileIcon />,
    <UserIcon />,
    <AlertTriangleIcon />,
  ];
  const tones: StatCardProps['tone'][] = ['primary', 'info', 'purple', 'warning'];

  return {
    stats: copy.stats.map((label, index) => ({
      id: `stat-${index}`,
      label,
      value: values[index] ?? '',
      delta: deltas[index],
      icon: icons[index],
      tone: tones[index],
    })),
    revenue: sampleRevenue(locale),
    categories: copy.categories.map((category, index) => ({
      category,
      sales: SALES[index] ?? 0,
      returns: RETURNS[index] ?? 0,
    })),
    activity: copy.activity.map((item, index) => ({
      id: `activity-${index}`,
      ...item,
      tone: ACTIVITY_TONES[index],
    })),
    records: copy.customers.map((customer, index) => ({
      id: `#${4821 - index}`,
      customer,
      amount: AMOUNTS[index] ?? 0,
      status: RECORD_STATUSES[index] ?? 'pending',
      date: copy.dates[index] ?? '',
    })),
  };
}

export { DASHBOARD_RANGES, RANGE_DAYS, dashboardSample, periodChange, revenueRows };
export type {
  ActivityItem,
  ActivityTone,
  CategoryPoint,
  DashboardRange,
  DashboardSample,
  DashboardStat,
  RecordRow,
  RecordStatus,
  RevenuePoint,
};
