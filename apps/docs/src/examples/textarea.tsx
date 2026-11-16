import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Auto-growing',
    render: () => (
      <div className="gap-row grid w-full max-w-md">
        <Field label="Notes" description="Grows with the content">
          <Textarea placeholder="Write something…" />
        </Field>
        <Textarea aria-label="Disabled" disabled defaultValue="Disabled" />
      </div>
    ),
  },
  {
    title: 'Large and fixed direction',
    render: () => (
      <div className="gap-row grid w-full max-w-md">
        <Textarea aria-label="Large" size="lg" placeholder="Large (pairs with Input size=lg)" />
        <Textarea aria-label="Invalid" aria-invalid defaultValue="Invalid value" />
        <Textarea aria-label="Fixed" autoDirection={false} placeholder="autoDirection off" />
      </div>
    ),
  },
];
