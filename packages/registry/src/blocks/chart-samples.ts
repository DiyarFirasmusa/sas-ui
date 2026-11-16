import type { ChartRow, ChartTrend, PieSlice } from '@/components/blocks/chart-data';
import type { ChartConfig } from '@/lib/chart';
import type { Locale } from '@/lib/locale';

/** Sample data for the chart blocks, written in both languages. Replace with your own. */
interface CartesianSample {
  title: string;
  description: string;
  data: ChartRow[];
  config: ChartConfig;
  trend: ChartTrend;
  footnote: string;
}

interface PieSample {
  title: string;
  description: string;
  slices: PieSlice[];
  config: ChartConfig;
  trend: ChartTrend;
  footnote: string;
}

const MONTHS: Record<Locale, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
};

const DESKTOP = [186, 305, 237, 273, 209, 314];
const MOBILE = [80, 200, 120, 190, 130, 140];

function monthly(locale: Locale): ChartRow[] {
  return MONTHS[locale].map((month, index) => ({
    month,
    desktop: DESKTOP[index] ?? 0,
    mobile: MOBILE[index] ?? 0,
  }));
}

const SERIES: Record<Locale, { desktop: string; mobile: string }> = {
  en: { desktop: 'Desktop', mobile: 'Mobile' },
  ar: { desktop: 'سطح المكتب', mobile: 'الجوّال' },
};

function seriesConfig(locale: Locale): ChartConfig {
  return {
    desktop: { label: SERIES[locale].desktop },
    mobile: { label: SERIES[locale].mobile },
  };
}

const COPY: Record<
  Locale,
  Record<
    'area' | 'bar' | 'line' | 'pie',
    Pick<CartesianSample, 'title' | 'description' | 'footnote'>
  > & {
    up: string;
    down: string;
  }
> = {
  en: {
    area: {
      title: 'Visitors',
      description: 'Visitors per month, January to June',
      footnote: 'Based on the last 6 months',
    },
    bar: {
      title: 'Sessions by device',
      description: 'Sessions per month, January to June',
      footnote: 'Based on the last 6 months',
    },
    line: {
      title: 'Active users',
      description: 'Active users per month, January to June',
      footnote: 'Based on the last 6 months',
    },
    pie: {
      title: 'Traffic sources',
      description: 'Share of visitors by channel',
      footnote: 'Based on the last 30 days',
    },
    up: 'Up 5.2% this month',
    down: 'Down 3.1% this month',
  },
  ar: {
    area: {
      title: 'الزوّار',
      description: 'عدد الزوّار شهرياً، من يناير إلى يونيو',
      footnote: 'بناءً على آخر 6 أشهر',
    },
    bar: {
      title: 'الجلسات حسب الجهاز',
      description: 'عدد الجلسات شهرياً، من يناير إلى يونيو',
      footnote: 'بناءً على آخر 6 أشهر',
    },
    line: {
      title: 'المستخدمون النشطون',
      description: 'المستخدمون النشطون شهرياً، من يناير إلى يونيو',
      footnote: 'بناءً على آخر 6 أشهر',
    },
    pie: {
      title: 'مصادر الزيارات',
      description: 'حصة الزوّار حسب القناة',
      footnote: 'بناءً على آخر 30 يوماً',
    },
    up: 'ارتفاع بنسبة 5.2% هذا الشهر',
    down: 'انخفاض بنسبة 3.1% هذا الشهر',
  },
};

function cartesian(locale: Locale, kind: 'area' | 'bar' | 'line', down = false): CartesianSample {
  return {
    ...COPY[locale][kind],
    data: monthly(locale),
    config: seriesConfig(locale),
    trend: down
      ? { direction: 'down', text: COPY[locale].down }
      : { direction: 'up', text: COPY[locale].up },
  };
}

function areaSample(locale: Locale): CartesianSample {
  return cartesian(locale, 'area');
}

function barSample(locale: Locale): CartesianSample {
  return cartesian(locale, 'bar');
}

function lineSample(locale: Locale): CartesianSample {
  return cartesian(locale, 'line');
}

const CHANNELS: Record<
  Locale,
  Record<'search' | 'direct' | 'social' | 'email' | 'other', string>
> = {
  en: { search: 'Search', direct: 'Direct', social: 'Social', email: 'Email', other: 'Other' },
  ar: {
    search: 'البحث',
    direct: 'مباشر',
    social: 'التواصل الاجتماعي',
    email: 'البريد',
    other: 'أخرى',
  },
};

function pieSample(locale: Locale): PieSample {
  const names = CHANNELS[locale];
  return {
    ...COPY[locale].pie,
    slices: [
      { id: 'search', value: 4350 },
      { id: 'direct', value: 2890 },
      { id: 'social', value: 1870 },
      { id: 'email', value: 1210 },
      { id: 'other', value: 520 },
    ],
    config: {
      search: { label: names.search },
      direct: { label: names.direct },
      social: { label: names.social },
      email: { label: names.email },
      other: { label: names.other },
    },
    trend: { direction: 'up', text: COPY[locale].up },
  };
}

export { areaSample, barSample, lineSample, pieSample };
export type { CartesianSample, PieSample };
