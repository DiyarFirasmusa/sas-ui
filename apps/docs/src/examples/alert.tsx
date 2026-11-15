import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Example } from '../example-types';

function Dismissible() {
  const [visible, setVisible] = useState(true);
  if (!visible) {
    return (
      <Button variant="outline" onClick={() => setVisible(true)}>
        Show alert again
      </Button>
    );
  }
  return (
    <Alert
      variant="info"
      title="New version available"
      description="Reload to get the latest improvements."
      onDismiss={() => setVisible(false)}
    />
  );
}

export const examples: Example[] = [
  {
    title: 'Variants',
    description:
      'Danger and warning are announced immediately (role="alert"); info and success politely (role="status").',
    render: () => (
      <div className="gap-row flex flex-col">
        <Alert
          variant="info"
          title="Heads up"
          description="Invoices are locked after the 5th of the month."
        />
        <Alert variant="success" title="Saved" description="Your changes are live." />
        <Alert
          variant="warning"
          title="Quota almost used"
          description="You have used 90% of your storage."
        />
        <Alert variant="danger" title="Payment failed" description="The card was declined." />
      </div>
    ),
  },
  {
    title: 'With action',
    render: () => (
      <Alert
        variant="warning"
        title="Your session expires soon"
        description="Stay signed in to keep your work."
        action={
          <Button size="sm" variant="outline">
            Stay signed in
          </Button>
        }
      />
    ),
  },
  {
    title: 'Dismissible',
    render: () => <Dismissible />,
  },
  {
    title: 'Arabic',
    render: () => (
      <Alert
        variant="danger"
        title="فشل الحفظ"
        description="تعذّر حفظ التغييرات. تحقق من الاتصال وحاول مرة أخرى."
        onDismiss={() => {}}
      />
    ),
  },
];
