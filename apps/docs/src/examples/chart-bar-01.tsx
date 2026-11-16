import { ChartBar01 } from '@/components/blocks/chart-bar-01';
import type { Example } from '../example-types';

const noop = () => {};

export const examples: Example[] = [
  {
    title: 'Bar chart',
    description:
      'Sample data in both languages. Pass `data` (and `config` for labels and colours); the trend line, summary and data table are props or derived.',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartBar01 />
      </div>
    ),
  },
  {
    title: 'Custom data',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartBar01
          title="Signups"
          description="New accounts per month"
          data={[
            { month: 'Jan', web: 120, app: 80 },
            { month: 'Feb', web: 180, app: 95 },
            { month: 'Mar', web: 150, app: 130 },
          ]}
          config={{ web: { label: 'Website' }, app: { label: 'App' } }}
          trend={{ direction: 'up', text: 'Up 12% on last quarter' }}
        />
      </div>
    ),
  },
  {
    title: 'Loading',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartBar01 loading />
      </div>
    ),
  },
  {
    title: 'Empty',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartBar01 data={[]} />
      </div>
    ),
  },
  {
    title: 'Error',
    wide: true,
    render: () => (
      <div className="p-page mx-auto max-w-3xl">
        <ChartBar01 error onRetry={noop} />
      </div>
    ),
  },
];
