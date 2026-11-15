import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Example } from '../example-types';

function Row({ children, ...props }: React.ComponentProps<typeof Checkbox> & { children: string }) {
  return (
    <label className="gap-field text-b1 flex items-center">
      <Checkbox {...props} /> {children}
    </label>
  );
}

function Parent() {
  const [items, setItems] = useState([true, false]);
  const all = items.every(Boolean);
  const some = items.some(Boolean);
  return (
    <div className="gap-field flex flex-col">
      <Row
        checked={all}
        indeterminate={some && !all}
        onCheckedChange={(next) => setItems(items.map(() => next))}
      >
        Select all
      </Row>
      <div className="gap-field flex flex-col ps-6">
        {items.map((checked, index) => (
          <Row
            key={index}
            checked={checked}
            onCheckedChange={(next) =>
              setItems(items.map((value, at) => (at === index ? next : value)))
            }
          >
            {`Item ${index + 1}`}
          </Row>
        ))}
      </div>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'States',
    render: () => (
      <div className="gap-field flex flex-col">
        <Row>Unchecked</Row>
        <Row defaultChecked>Checked</Row>
        <Row disabled>Disabled</Row>
        <Row defaultChecked disabled>
          Disabled checked
        </Row>
      </div>
    ),
  },
  { title: 'Indeterminate parent', render: () => <Parent /> },
];
