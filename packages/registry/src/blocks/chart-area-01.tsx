import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/blocks/chart-card';
import { useCartesianBlock, type CartesianChartProps } from '@/components/blocks/chart-cartesian';
import { seriesColorVar } from '@/components/blocks/chart-data';
import { areaSample } from '@/components/blocks/chart-samples';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartAxes,
} from '@/components/ui/chart';
import { formatChartNumber } from '@/lib/chart';

interface ChartArea01Props extends CartesianChartProps {
  /** Stack the series on top of each other instead of overlapping them. */
  stacked?: boolean;
}

/**
 * Area chart card: one filled area per series, tooltip, legend and a trend
 * line in the footer. In Arabic time runs right to left and the value axis
 * moves to the right. Numbers keep Latin digits.
 */
function ChartArea01({ stacked = false, ...props }: ChartArea01Props) {
  const block = useCartesianBlock(props, areaSample);
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
        <AreaChart data={block.data} margin={{ left: 4, right: 4, top: 8 }}>
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
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          {block.keys.map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="monotone"
              stroke={seriesColorVar(key)}
              fill={seriesColorVar(key)}
              fillOpacity={0.25}
              strokeWidth={2}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}

export { ChartArea01 };
export type { ChartArea01Props };
