import * as Icons from '@/components/ui/icons';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'All icons',
    description:
      'Decorative by default. Directional glyphs (chevrons, arrows) mirror in RTL — flip the direction to see.',
    wide: true,
    render: () => (
      <ul className="gap-field grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(Icons).map(([name, Icon]) => (
          <li
            key={name}
            className="gap-field border-stroke text-b3 flex items-center rounded-md border p-2"
          >
            <Icon className="text-text-primary size-5" />
            <span className="truncate">{name.replace(/Icon$/, '')}</span>
          </li>
        ))}
      </ul>
    ),
  },
];
