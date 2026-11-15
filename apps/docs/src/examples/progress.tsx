import { Progress } from '@/components/ui/progress';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Label and value',
    render: () => <Progress value={64} label="Storage used" />,
  },
  {
    title: 'Tones',
    render: () => (
      <div className="gap-row flex flex-col">
        <Progress value={100} tone="success" label="Import complete" />
        <Progress value={82} tone="warning" label="Quota" />
        <Progress value={35} tone="danger" label="Failed rows" />
      </div>
    ),
  },
  {
    title: 'Indeterminate',
    description: 'No percentage while the amount of work is unknown.',
    render: () => <Progress value={null} label="Syncing…" />,
  },
  {
    title: 'Small, no value',
    render: () => <Progress value={40} size="sm" showValue={false} aria-label="Upload" />,
  },
  {
    title: 'Arabic',
    description: 'Digits stay Latin in every locale.',
    render: () => <Progress value={45} label="رفع الملفات" />,
  },
];
