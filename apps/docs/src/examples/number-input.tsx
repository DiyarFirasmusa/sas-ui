import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { NumberInput } from '@/components/ui/number-input';
import type { Example } from '../example-types';

function Controlled() {
  const [value, setValue] = useState<number | null>(2);
  return (
    <Field label="Quantity" description={`Value: ${value ?? 'empty'}`} className="w-48">
      <NumberInput value={value} onValueChange={setValue} min={1} max={10} />
    </Field>
  );
}

export const examples: Example[] = [
  { title: 'Min, max and step', render: () => <Controlled /> },
  {
    title: 'Decimals and a larger step',
    render: () => (
      <Field label="Price" description="Hold Shift for steps of 10" className="w-48">
        <NumberInput
          defaultValue={19.5}
          step={0.5}
          min={0}
          format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        />
      </Field>
    ),
  },
  {
    title: 'Without steppers',
    render: () => (
      <Field label="Year" className="w-40">
        <NumberInput showSteppers={false} defaultValue={2025} format={{ useGrouping: false }} />
      </Field>
    ),
  },
  {
    title: 'Disabled and invalid',
    render: () => (
      <>
        <Field label="Locked" className="w-40">
          <NumberInput defaultValue={5} disabled />
        </Field>
        <Field label="Seats" error="At least 1 seat is required" className="w-48">
          <NumberInput defaultValue={0} min={0} />
        </Field>
      </>
    ),
  },
  {
    title: 'Arabic: Latin digits, left-to-right value',
    render: () => (
      <Field label="الكمية" className="w-48">
        <NumberInput defaultValue={1500} min={0} />
      </Field>
    ),
  },
];
