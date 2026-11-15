import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';
import type { Example } from '../example-types';

function Budget() {
  const [range, setRange] = useState<readonly number[]>([200, 800]);
  return (
    <Field label="Budget" description={`Between ${range[0]} and ${range[1]}`} className="w-80">
      <Slider
        value={range}
        onValueChange={(next) => setRange(typeof next === 'number' ? [next] : next)}
        min={0}
        max={1000}
        step={50}
        showValue
      />
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: 'Single value',
    render: () => (
      <Field label="Volume" className="w-72">
        <Slider defaultValue={40} showValue />
      </Field>
    ),
  },
  { title: 'Range, controlled', render: () => <Budget /> },
  {
    title: 'Steps and a custom range',
    render: () => (
      <Field label="Rating" className="w-72">
        <Slider defaultValue={3} min={1} max={5} step={1} showValue />
      </Field>
    ),
  },
  {
    title: 'Disabled',
    render: () => (
      <Field label="Locked" className="w-72">
        <Slider defaultValue={[20, 60]} disabled showValue />
      </Field>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <Field label="Discount" error="Discount cannot exceed 30%" className="w-72">
        <Slider defaultValue={55} showValue />
      </Field>
    ),
  },
  {
    title: 'Arabic (minimum on the right)',
    render: () => (
      <Field label="السعر" className="w-72">
        <Slider defaultValue={[20, 70]} showValue />
      </Field>
    ),
  },
];
