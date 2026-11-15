import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { TreePicker } from '@/components/ui/tree-picker';
import type { TreeNode } from '@/lib/tree-utils';
import type { Example } from '../example-types';

const units: TreeNode[] = [
  {
    id: 'hq',
    label: 'Head office',
    children: [
      {
        id: 'finance',
        label: 'Finance',
        children: [
          { id: 'payables', label: 'Accounts payable' },
          { id: 'receivables', label: 'Accounts receivable' },
        ],
      },
      {
        id: 'ops',
        label: 'Operations',
        children: [
          {
            id: 'logistics',
            label: 'Logistics',
            children: [{ id: 'fleet', label: 'Fleet' }],
          },
        ],
      },
    ],
  },
  {
    id: 'north',
    label: 'الفرع الشمالي',
    children: [{ id: 'north-sales', label: 'المبيعات' }],
  },
];

function Single() {
  const [value, setValue] = useState<string | null>('payables');
  return (
    <Field label="Organisation unit" description="Pick any level of the hierarchy.">
      <TreePicker
        aria-label="Organisation unit"
        nodes={units}
        value={value}
        onValueChange={setValue}
      />
    </Field>
  );
}

function Multiple() {
  const [value, setValue] = useState<string[]>(['finance']);
  return (
    <Field label="Units" description="A checked branch includes everything below it.">
      <TreePicker
        multiple
        aria-label="Units"
        nodes={units}
        value={value}
        onValueChange={setValue}
      />
    </Field>
  );
}

export const examples: Example[] = [
  { title: 'Single', render: () => <Single /> },
  { title: 'Multiple', render: () => <Multiple /> },
  {
    title: 'Invalid',
    render: () => <TreePicker aria-label="Unit" nodes={units} invalid placeholder="Required" />,
  },
  {
    title: 'Loading and error',
    render: () => (
      <div className="gap-row flex flex-col">
        <TreePicker aria-label="Loading units" nodes={[]} loading />
        <TreePicker aria-label="Failed units" nodes={[]} error onRetry={() => {}} />
      </div>
    ),
  },
  {
    title: 'Disabled',
    render: () => <TreePicker aria-label="Unit" nodes={units} defaultValue="fleet" disabled />,
  },
];
