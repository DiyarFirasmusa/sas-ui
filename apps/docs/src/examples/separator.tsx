import { Separator } from '@/components/ui/separator';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Horizontal',
    render: () => (
      <div className="gap-row text-b1 flex w-72 flex-col">
        <span>Profile</span>
        <Separator />
        <span>Billing</span>
      </div>
    ),
  },
  {
    title: 'Vertical',
    render: () => (
      <div className="gap-row text-b1 flex h-6 items-center">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
        <Separator orientation="vertical" />
        <span>Support</span>
      </div>
    ),
  },
  {
    title: 'Decorative',
    description: 'Hidden from screen readers when the line only adds rhythm.',
    render: () => (
      <div className="gap-row text-b1 flex w-72 flex-col">
        <span>Heading</span>
        <Separator decorative />
        <span>Body</span>
      </div>
    ),
  },
];
