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
    title: 'Sizes',
    description: 'A 26px pill by default; `sm` is the 22px badge used inside table rows.',
    render: () => (
      <>
        <Badge tone="blue">Default</Badge>
        <Badge tone="blue" size="sm">
          Small
        </Badge>
      </>
    ),
  },
  {
    title: 'Status dot',
    description: 'A dot and the tone colour with no container, as status cells draw it in a table.',
    render: () => (
      <>
        <Badge tone="green" size="sm" dot>
          Active
        </Badge>
        <Badge tone="orange" size="sm" dot>
          Pending
        </Badge>
        <Badge tone="red" size="sm" dot>
          Rejected
        </Badge>
        <Badge tone="neutral" size="sm" dot>
          Inactive
        </Badge>
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
