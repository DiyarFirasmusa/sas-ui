import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { TimePicker } from '@/components/ui/time-picker';
import type { Example } from '../example-types';

function Controlled() {
  const [value, setValue] = useState<string | null>('09:30');
  return (
    <Field label="Opening time" description={`Value: ${value ?? 'incomplete'}`}>
      <TimePicker value={value} onValueChange={setValue} />
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: '24-hour',
    description: 'Type digits, or use Up/Down, Home/End and PageUp/PageDown on a segment.',
    render: () => (
      <Field label="Start time">
        <TimePicker />
      </Field>
    ),
  },
  { title: 'Controlled', render: () => <Controlled /> },
  {
    title: '12-hour with AM/PM',
    render: () => (
      <Field label="Meeting">
        <TimePicker hourCycle={12} defaultValue="15:30" />
      </Field>
    ),
  },
  {
    title: 'Minute step',
    description: 'Arrow keys move minutes in steps of 15.',
    render: () => (
      <Field label="Slot">
        <TimePicker minuteStep={15} defaultValue="10:00" />
      </Field>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <Field label="Closing time" error="Closing time must be after opening time">
        <TimePicker defaultValue="08:00" />
      </Field>
    ),
  },
  {
    title: 'Disabled and read-only',
    render: () => (
      <div className="gap-row flex flex-col">
        <Field label="Locked">
          <TimePicker disabled defaultValue="09:00" />
        </Field>
        <Field label="Read-only">
          <TimePicker readOnly defaultValue="17:45" />
        </Field>
      </div>
    ),
  },
];
