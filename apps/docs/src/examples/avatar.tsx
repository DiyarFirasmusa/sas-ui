import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import type { Example } from '../example-types';

const team = [
  { name: 'Layla Hassan' },
  { name: 'محمد علي الحسن' },
  { name: 'Grace Hopper' },
  { name: 'فاطمة الزهراء' },
  { name: 'Ken Thompson' },
  { name: 'Nour Saleh' },
];

export const examples: Example[] = [
  {
    title: 'Initials fallback',
    description: 'First letters of the first two words on the brand fill.',
    render: () => (
      <div className="gap-inline flex items-center">
        <Avatar name="Layla Hassan" />
        <Avatar name="محمد علي" />
        <Avatar name="Grace" />
        <Avatar />
      </div>
    ),
  },
  {
    title: 'Colour from the name',
    description:
      'The initials sit on the brand fill by default; `tone="auto"` picks a tag hue per name.',
    render: () => (
      <div className="gap-inline flex items-center">
        <Avatar name="Layla Hassan" tone="auto" />
        <Avatar name="Grace Hopper" tone="auto" />
        <Avatar name="محمد علي" tone="auto" />
      </div>
    ),
  },
  {
    title: 'Sizes',
    render: () => (
      <div className="gap-inline flex items-center">
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Avatar key={size} name="Layla Hassan" size={size} />
        ))}
      </div>
    ),
  },
  {
    title: 'Group with overflow',
    render: () => <AvatarGroup people={team} max={4} label="Project team" />,
  },
];
