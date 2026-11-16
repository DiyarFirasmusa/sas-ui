import { Settings01 } from '@/components/blocks/settings-01';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Settings',
    description:
      'Handlers are props. Here saving takes a moment and deleting does nothing; wire them to your API.',
    wide: true,
    render: () => (
      <Settings01
        onSaveProfile={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
        onSaveNotifications={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
      />
    ),
  },
  {
    title: 'Opened on the danger zone',
    wide: true,
    render: () => <Settings01 defaultSection="danger" />,
  },
];
