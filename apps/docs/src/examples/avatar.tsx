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
    description: 'First letters of the first two words; the colour comes from the name, so it is stable.',
    render: () => (
      <div className="flex items-center gap-inline">
        <Avatar name="Layla Hassan" />
        <Avatar name="محمد علي" />
        <Avatar name="Grace" />
        <Avatar />
      </div>
    ),
  },
  {
    title: 'Sizes',
    render: () => (
      <div className="flex items-center gap-inline">
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
