import { ChartPie01 } from '@/components/blocks/chart-pie-01';
import type { Example } from '../example-types';

const noop = () => {};

export const examples: Example[] = [
  {
    title: 'Donut chart',
    description:
      'Total in the centre and a legend list with each value and share. Pass `slices` and a `config` of labels and colours; `centerValue` replaces the computed total.',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartPie01 />
      </div>
    ),
  },
  {
    title: 'Custom data',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartPie01
          title="Plans"
          description="Accounts by plan"
          slices={[
            { id: 'free', value: 640 },
            { id: 'team', value: 210 },
            { id: 'business', value: 95 },
          ]}
          config={{
            free: { label: 'Free' },
            team: { label: 'Team' },
            business: { label: 'Business' },
          }}
          centerLabel="Accounts"
        />
      </div>
    ),
  },
  {
    title: 'Loading',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartPie01 loading />
      </div>
    ),
  },
  {
    title: 'Empty',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartPie01 slices={[]} />
      </div>
    ),
  },
  {
    title: 'Error',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartPie01 error onRetry={noop} />
      </div>
    ),
  },
];
