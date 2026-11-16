import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useZodForm, Form } from '@/components/ui/form';
import {
  CheckboxField,
  DateField,
  NumberField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
  TimeField,
} from '@/components/ui/form-fields';
import type { Example } from '../example-types';

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  status: z.string().min(1, 'Pick a status'),
  seats: z.number({ error: 'Required' }).min(1, 'At least 1'),
  day: z.string().min(1, 'Pick a day'),
  at: z.string().min(1, 'Pick a time'),
  notes: z.string(),
  active: z.boolean(),
  terms: z.boolean().refine((value) => value, 'Accept the terms'),
});

function Demo() {
  const form = useZodForm(schema, {
    defaultValues: {
      name: '',
      status: '',
      seats: null as unknown as number,
      day: '',
      at: '',
      notes: '',
      active: true,
      terms: false,
    },
  });
  return (
    <Form form={form} onSubmit={() => {}} className="gap-row grid w-full max-w-lg">
      <TextField control={form.control} name="name" label="Name" required />
      <SelectField
        control={form.control}
        name="status"
        label="Status"
        placeholder="Pick one"
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'sent', label: 'Sent' },
        ]}
      />
      <NumberField control={form.control} name="seats" label="Seats" min={1} />
      <div className="gap-row grid sm:grid-cols-2">
        <DateField control={form.control} name="day" label="Date" clearable />
        <TimeField control={form.control} name="at" label="Time" />
      </div>
      <TextareaField control={form.control} name="notes" label="Notes" />
      <SwitchField control={form.control} name="active" label="Active" />
      <CheckboxField control={form.control} name="terms" label="I accept the terms" />
      <Button type="submit" className="self-start">
        Submit to see errors
      </Button>
    </Form>
  );
}

export const examples: Example[] = [
  {
    title: 'Bound fields (react-hook-form + zod)',
    description:
      'The switch field is a settings row: label and description at the start, the switch at the end. Labels use the 12px 600 field style; descriptions are secondary text.',
    wide: true,
    render: () => <Demo />,
  },
];
