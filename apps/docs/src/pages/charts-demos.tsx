import { ChartArea01 } from '@/components/blocks/chart-area-01';
import { ChartBar01 } from '@/components/blocks/chart-bar-01';
import { ChartLine01 } from '@/components/blocks/chart-line-01';
import { ChartPie01 } from '@/components/blocks/chart-pie-01';

/** The live chart card for a tab of the charts gallery. */
export function ChartAreaBlock({ kind }: { kind: string }) {
  switch (kind) {
    case 'bar':
      return <ChartBar01 />;
    case 'line':
      return <ChartLine01 />;
    case 'pie':
      return <ChartPie01 />;
    default:
      return <ChartArea01 />;
  }
}
