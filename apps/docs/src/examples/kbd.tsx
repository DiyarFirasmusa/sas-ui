import { Kbd, KbdGroup } from '@/components/ui/kbd';
import type { Example } from '../example-types';

export const examples: Example[] = [
  { title: 'Single key', render: () => <Kbd>Esc</Kbd> },
  {
    title: 'Key combination',
    description: 'Pass `keys`; the order is the order typed.',
    render: () => <Kbd keys={['Ctrl', 'Shift', 'K']} />,
  },
  {
    title: 'Inside Arabic text',
    description: 'Always left-to-right, even in a right-to-left sentence.',
    render: () => (
      <p dir="rtl" className="text-b1">
        اضغط <Kbd keys={['Ctrl', 'K']} /> لفتح البحث
      </p>
    ),
  },
  {
    title: 'Custom group',
    render: () => (
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
    ),
  },
];
