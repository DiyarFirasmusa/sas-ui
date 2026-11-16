import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertTriangleIcon } from '@/components/ui/icons';
import type { Example } from '../example-types';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function AsyncDelete() {
  const [deleted, setDeleted] = useState(false);
  return (
    <div className="gap-inline flex items-center">
      <ConfirmDialog
        trigger={<Button variant="destructive">Delete invoice</Button>}
        destructive
        title="Delete invoice 1042?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          await wait(1200);
          setDeleted(true);
        }}
      />
      {deleted ? <span className="text-b2 text-text-secondary">Deleted.</span> : null}
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    render: () => (
      <ConfirmDialog
        trigger={<Button variant="outline">Publish</Button>}
        title="Publish this report?"
        description="Everyone in your organisation will be able to see it."
        onConfirm={() => {}}
      />
    ),
  },
  {
    title: 'With a glyph',
    description: 'The glyph sits beside the title; a destructive dialog tints it red.',
    render: () => (
      <ConfirmDialog
        trigger={<Button variant="destructive-soft">Archive</Button>}
        destructive
        icon={<AlertTriangleIcon />}
        title="Archive this client?"
        description="Their open invoices stay visible."
        confirmLabel="Archive"
        onConfirm={() => {}}
      />
    ),
  },
  {
    title: 'Destructive and async',
    description:
      'Confirm shows a spinner and is single-flight; the dialog stays open until the promise resolves.',
    render: () => <AsyncDelete />,
  },
  {
    title: 'Failure keeps it open',
    description: 'A rejected onConfirm shows the error and lets the user retry.',
    render: () => (
      <ConfirmDialog
        trigger={<Button variant="destructive-soft">Delete (fails)</Button>}
        destructive
        title="Delete invoice?"
        onConfirm={async () => {
          await wait(800);
          throw new Error('The server refused the request.');
        }}
      />
    ),
  },
  {
    title: 'Arabic',
    render: () => (
      <ConfirmDialog
        trigger={<Button variant="outline">حذف</Button>}
        destructive
        title="حذف الفاتورة؟"
        description="لا يمكن التراجع عن هذا الإجراء."
        onConfirm={() => {}}
      />
    ),
  },
];
