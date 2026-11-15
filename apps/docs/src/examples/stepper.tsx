import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import type { Example } from '../example-types';

const steps: StepperStep[] = [
  { label: 'Account', description: 'Your details' },
  { label: 'Payment', description: 'Card or transfer' },
  { label: 'Review', description: 'Check and confirm' },
  { label: 'Done' },
];

function Interactive() {
  const [current, setCurrent] = useState(1);
  return (
    <div className="gap-row flex w-full max-w-2xl flex-col">
      <Stepper steps={steps} current={current} onStepClick={setCurrent} />
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
          disabled={current === steps.length - 1}
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
    title: 'Horizontal',
    wide: true,
    render: () => (
      <div className="w-full max-w-2xl">
        <Stepper steps={steps} current={1} />
      </div>
    ),
  },
  {
    title: 'Vertical',
    render: () => <Stepper steps={steps} current={2} orientation="vertical" className="max-w-xs" />,
  },
  {
    title: 'Clickable steps',
    description: 'Passing onStepClick turns each step into a button.',
    wide: true,
    render: () => <Interactive />,
  },
  {
    title: 'Error state',
    wide: true,
    render: () => (
      <div className="w-full max-w-2xl">
        <Stepper
          steps={[
            { label: 'Account' },
            { label: 'Payment', description: 'Card declined', error: true },
            { label: 'Review' },
          ]}
          current={1}
        />
      </div>
    ),
  },
  {
    title: 'Arabic (RTL)',
    description: 'Order and connectors mirror; the numbers stay Latin.',
    wide: true,
    render: () => (
      <div dir="rtl" className="w-full max-w-2xl">
        <Stepper
          steps={[
            { label: 'الحساب', description: 'بياناتك' },
            { label: 'الدفع', description: 'بطاقة أو تحويل' },
            { label: 'المراجعة' },
          ]}
          current={1}
        />
      </div>
    ),
  },
];
