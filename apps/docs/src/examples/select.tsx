import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import type { Example } from '../example-types';

const options = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'void', label: 'Void', disabled: true },
];

export const examples: Example[] = [
  {
    title: 'Options array',
    render: () => (
      <div className="gap-row grid w-full max-w-xs">
        <Select aria-label="Status" placeholder="Choose a status" options={options} />
        <Select aria-label="Preselected" defaultValue="review" options={options} />
        <Field label="In a field" description="Label and description are linked">
          <Select placeholder="Choose" options={options} />
        </Field>
      </div>
    ),
  },
];
