import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/blocks/chart-card';
import { useCartesianBlock, type CartesianChartProps } from '@/components/blocks/chart-cartesian';
import { seriesColorVar } from '@/components/blocks/chart-data';
import { lineSample } from '@/components/blocks/chart-samples';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartAxes,
} from '@/components/ui/chart';
import { formatChartNumber } from '@/lib/chart';

interface ChartLine01Props extends CartesianChartProps {
  /** Mark every data point with a dot, not only the hovered one. */
  showDots?: boolean;
}

/**
 * Line chart card: one line per series with tooltip, legend and a trend line
 * in the footer. Time runs right to left in Arabic and the value axis moves
 * to the right. Numbers keep Latin digits.
 */
function ChartLine01({ showDots = true, ...props }: ChartLine01Props) {
  const block = useCartesianBlock(props, lineSample);
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
        <LineChart data={block.data} margin={{ left: 4, right: 4, top: 8 }}>
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
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={seriesColorVar(key)}
              strokeWidth={2}
              dot={showDots ? { r: 3, fill: seriesColorVar(key), strokeWidth: 0 } : false}
              activeDot={{ r: 5 }}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}

export { ChartLine01 };
export type { ChartLine01Props };
