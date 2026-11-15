import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Label, description and error',
    render: () => (
      <div className="gap-row grid w-full max-w-md">
        <Field label="Full name" required description="As written on the passport">
          <Input placeholder="Layla Hassan" />
        </Field>
        <Field label="Email" error="Enter a valid email address">
          <Input type="email" defaultValue="layla@" />
        </Field>
        <Field label="Locked" description="Managed by an administrator">
          <Input disabled defaultValue="read only" />
        </Field>
      </div>
    ),
  },
];
