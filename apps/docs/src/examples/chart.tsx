import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartAxes,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/lib/chart';
import { formatChartNumber } from '@/lib/chart';
import type { Example } from '../example-types';

const monthly = [
  { month: 'Jan', revenue: 18600, costs: 8000 },
  { month: 'Feb', revenue: 30500, costs: 20000 },
  { month: 'Mar', revenue: 23700, costs: 12000 },
  { month: 'Apr', revenue: 27300, costs: 19000 },
  { month: 'May', revenue: 20900, costs: 13000 },
  { month: 'Jun', revenue: 31400, costs: 14000 },
];

const config = {
  revenue: { label: 'Revenue' },
  costs: { label: 'Costs' },
} satisfies ChartConfig;

function RevenueBars() {
  const axes = useChartAxes({ reverseTime: false });
  return (
    <ChartContainer
      config={config}
      label="Revenue and costs by month"
      summary="Revenue peaks in June at 31,400; costs peak in February at 20,000."
      dataTable={{
        data: monthly,
        categoryKey: 'month',
        categoryLabel: 'Month',
      }}
      className="max-w-xl"
    >
      <BarChart data={monthly}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} {...axes.xAxis} />
        <YAxis
          tickFormatter={formatChartNumber}
          tickLine={false}
          axisLine={false}
          {...axes.yAxis}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="costs" fill="var(--color-costs)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

function TimeSeries() {
  // In RTL the time axis runs right to left and the value axis moves to the start edge.
  const axes = useChartAxes();
  return (
    <ChartContainer config={config} label="Revenue over time" className="max-w-xl">
      <AreaChart data={monthly}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} {...axes.xAxis} />
        <YAxis
          tickFormatter={formatChartNumber}
          tickLine={false}
          axisLine={false}
          {...axes.yAxis}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          fill="var(--color-revenue)"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const share = [
  { channel: 'web', visitors: 275 },
  { channel: 'mobile', visitors: 200 },
  { channel: 'partners', visitors: 187 },
];
const shareConfig = {
  web: { label: 'Web' },
  mobile: { label: 'Mobile' },
  partners: { label: 'Partners' },
} satisfies ChartConfig;

export const examples: Example[] = [
  {
    title: 'Bar chart',
    description:
      'Series colours come from the config (default --chart-1..5) and are read by the bars as var(--color-<key>). Screen readers get the summary and a hidden data table.',
    wide: true,
    render: () => <RevenueBars />,
  },
  {
    title: 'Time series (RTL-aware axes)',
    description:
      'useChartAxes() reverses the X axis and moves the Y axis in right-to-left languages.',
    wide: true,
    render: () => <TimeSeries />,
  },
  {
    title: 'Pie with legend',
    render: () => (
      <ChartContainer config={shareConfig} label="Visitors by channel" className="max-w-sm">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="channel" />} />
          <Pie data={share} dataKey="visitors" nameKey="channel" innerRadius={50}>
            {share.map((entry) => (
              <Cell key={entry.channel} fill={`var(--color-${entry.channel})`} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="channel" />} />
        </PieChart>
      </ChartContainer>
    ),
  },
  {
    title: 'Loading',
    render: () => (
      <ChartContainer config={config} loading className="max-w-xl">
        <BarChart data={[]} />
      </ChartContainer>
    ),
  },
  {
    title: 'Empty',
    render: () => (
      <ChartContainer config={config} empty className="max-w-xl">
        <BarChart data={[]} />
      </ChartContainer>
    ),
  },
];
