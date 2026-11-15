import { Badge } from '@/components/ui/badge';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Tones',
    description:
      'Each tone is a tag-hue text/container pair from the active preset, checked for AA contrast.',
    render: () => (
      <>
        {(
          [
            'neutral',
            'green',
            'red',
            'yellow',
            'orange',
            'cyan',
            'purple',
            'blue',
            'primary',
            'solid',
          ] as const
        ).map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </>
    ),
  },
  {
    title: 'Outline',
    render: () => (
      <>
        <Badge tone="green" outline>
          Paid
        </Badge>
        <Badge tone="red" outline>
          Overdue
        </Badge>
      </>
    ),
  },
];
