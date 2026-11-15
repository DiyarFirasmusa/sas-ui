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
];
