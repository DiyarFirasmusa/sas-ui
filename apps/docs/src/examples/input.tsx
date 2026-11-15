import { Input } from '@/components/ui/input';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Direction follows the typed language',
    description:
      'Empty: the UI direction. Type Arabic or English: it switches to dir=auto. Latin-only fields stay left-to-right.',
    render: () => (
      <div className="gap-row grid w-full max-w-md">
        <Input aria-label="Title" placeholder="Title" />
        <Input aria-label="Reference" kind="latin" placeholder="TB-2026-0001" />
        <Input aria-label="Email" type="email" placeholder="name@company.com" />
        <Input aria-label="Disabled" disabled defaultValue="Disabled" />
        <Input aria-label="Invalid" aria-invalid defaultValue="Invalid value" />
      </div>
    ),
  },
];
