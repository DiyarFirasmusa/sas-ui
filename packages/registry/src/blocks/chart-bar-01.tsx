import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/blocks/chart-card';
import { useCartesianBlock, type CartesianChartProps } from '@/components/blocks/chart-cartesian';
import { seriesColorVar } from '@/components/blocks/chart-data';
import { barSample } from '@/components/blocks/chart-samples';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartAxes,
} from '@/components/ui/chart';
import { formatChartNumber } from '@/lib/chart';

interface ChartBar01Props extends CartesianChartProps {
  /** Stack the series in one bar instead of grouping them side by side. */
  stacked?: boolean;
}

/**
 * Bar chart card: grouped (or stacked) bars per category with tooltip, legend
 * and a trend line in the footer. Time runs right to left in Arabic and the
 * value axis moves to the right; pass `reverseTime={false}` for categories
 * that are not a sequence. Numbers keep Latin digits.
 */
function ChartBar01({ stacked = false, ...props }: ChartBar01Props) {
  const block = useCartesianBlock(props, barSample);
  const axes = useChartAxes({ reverseTime: block.reverseTime });

  return (
    <ChartCard {...block.card}>
      <ChartContainer
        config={block.config}
        label={block.chartLabel}
        summary={block.summary}
        dataTable={block.dataTable}
        loading={block.loading}
        empty={block.empty}
      >
        <BarChart data={block.data} margin={{ left: 4, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={block.xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            {...axes.xAxis}
          />
          <YAxis
            width={44}
            tickFormatter={formatChartNumber}
            tickLine={false}
            axisLine={false}
            {...axes.yAxis}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          {block.keys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={seriesColorVar(key)}
              radius={stacked ? 0 : 4}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export { ChartBar01 };
export type { ChartBar01Props };
