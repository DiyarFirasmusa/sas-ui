import { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import type { Example } from '../example-types';

function Controlled() {
  const [value, setValue] = useState<string | null>('2026-11-18');
  return (
    <Field label="Due date" description={`Value: ${value ?? 'none'}`} className="w-72">
      <DatePicker value={value} onValueChange={setValue} clearable />
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    render: () => (
      <Field label="Start date" className="w-72">
        <DatePicker />
      </Field>
    ),
  },
  { title: 'Controlled and clearable', render: () => <Controlled /> },
  {
    title: 'Shorter display',
    render: () => (
      <Field label="Issued" className="w-72">
        <DatePicker defaultValue="2026-03-05" dateStyle="medium" />
      </Field>
    ),
  },
  {
    title: 'Limits and unavailable days',
    description: 'Only weekdays in the next weeks can be chosen.',
    render: () => (
      <Field label="Appointment" description="Weekends are unavailable" className="w-72">
        <DatePicker
          defaultMonth="2026-11-01"
          min="2026-11-10"
          max="2026-12-20"
          isDateDisabled={(date) => date.getDay() === 5 || date.getDay() === 6}
        />
      </Field>
    ),
  },
  {
    title: 'Arabic-Indic digits',
    render: () => (
      <Field label="Date" className="w-72">
        <DatePicker defaultValue="2026-11-18" numerals="locale" />
      </Field>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <Field label="Birth date" error="Birth date is required" className="w-72">
        <DatePicker />
      </Field>
    ),
  },
  {
    title: 'Disabled and read-only',
    render: () => (
      <div className="gap-row flex w-72 flex-col">
        <Field label="Locked">
          <DatePicker disabled defaultValue="2026-11-18" />
        </Field>
        <Field label="Read-only">
          <DatePicker readOnly defaultValue="2026-11-18" />
        </Field>
      </div>
    ),
  },
];
