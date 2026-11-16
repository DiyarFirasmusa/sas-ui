import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@/components/ui/icons';
import { Steps, type StepItem } from '@/components/ui/steps';
import type { Example } from '../example-types';

const items: StepItem[] = [
  { id: 'details', label: 'Details' },
  { id: 'travellers', label: 'Travellers' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirm', label: 'Confirmation' },
];

function Wizard() {
  const [current, setCurrent] = useState(1);
  return (
    <div className="gap-row flex w-full max-w-2xl flex-col">
      <Steps
        items={items}
        current={current}
        onStepSelect={(_id, index) => setCurrent(index)}
        label="Booking progress"
      />
      <div className="gap-field flex">
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent(current - 1)}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={current === items.length - 1}
          onClick={() => setCurrent(current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Wizard header',
    description:
      'Completed steps swap the number for a check and can be clicked to go back. The current step has aria-current="step"; the row scrolls sideways on narrow screens.',
    render: () => <Wizard />,
  },
  {
    title: 'Read-only',
    description: 'Without onStepSelect the steps are plain text, not buttons.',
    render: () => <Steps items={items} current={2} />,
  },
  {
    title: 'With icons',
    description: 'An icon replaces the number while a step is current or upcoming.',
    render: () => (
      <Steps
        items={[
          { id: 'dates', label: 'Dates', icon: CalendarIcon },
          { id: 'rooms', label: 'Rooms', icon: CalendarIcon },
          { id: 'pay', label: 'Pay' },
        ]}
        current={0}
      />
    ),
  },
];
