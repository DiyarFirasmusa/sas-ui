import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Example } from '../example-types';

function Controlled() {
  const [value, setValue] = useState('standard');
  return (
    <Field label="Shipping" description={`Selected: ${value}`} className="w-72">
      <RadioGroup value={value} onValueChange={setValue}>
        <RadioGroupItem value="standard" label="Standard" description="3 to 5 days" />
        <RadioGroupItem value="express" label="Express" description="Next day" />
        <RadioGroupItem value="pickup" label="Pickup" description="From the branch" />
      </RadioGroup>
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: 'In a field, vertical',
    description: 'The field label names the group; arrow keys move the choice.',
    render: () => <Controlled />,
  },
  {
    title: 'Horizontal',
    render: () => (
      <Field label="Priority" className="w-96">
        <RadioGroup orientation="horizontal" defaultValue="normal">
          <RadioGroupItem value="low" label="Low" />
          <RadioGroupItem value="normal" label="Normal" />
          <RadioGroupItem value="high" label="High" />
        </RadioGroup>
      </Field>
    ),
  },
  {
    title: 'Disabled option and disabled group',
    render: () => (
      <>
        <Field label="Plan" className="w-56">
          <RadioGroup defaultValue="free">
            <RadioGroupItem value="free" label="Free" />
            <RadioGroupItem value="pro" label="Pro" />
            <RadioGroupItem value="enterprise" label="Enterprise (contact us)" disabled />
          </RadioGroup>
        </Field>
        <Field label="Locked" className="w-56">
          <RadioGroup disabled defaultValue="a">
            <RadioGroupItem value="a" label="Option A" />
            <RadioGroupItem value="b" label="Option B" />
          </RadioGroup>
        </Field>
      </>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <Field label="Payment method" error="Choose a payment method" required className="w-72">
        <RadioGroup>
          <RadioGroupItem value="card" label="Card" />
          <RadioGroupItem value="cash" label="Cash" />
        </RadioGroup>
      </Field>
    ),
  },
  {
    title: 'Arabic labels',
    render: () => (
      <Field label="طريقة التواصل" className="w-72">
        <RadioGroup defaultValue="email">
          <RadioGroupItem value="email" label="البريد الإلكتروني" description="نرسل ملخصًا أسبوعيًا" />
          <RadioGroupItem value="phone" label="الهاتف" />
        </RadioGroup>
      </Field>
    ),
  },
];
