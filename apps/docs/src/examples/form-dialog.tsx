import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import type { Example } from '../example-types';

function NewClient({ confirmDiscard }: { confirmDiscard?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New client</Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="New client"
        description="Add a client to your directory."
        onSubmit={save}
        isSubmitting={saving}
        confirmDiscard={confirmDiscard}
      >
        <Field label="Name" required>
          <Input name="name" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" />
        </Field>
      </FormDialog>
    </>
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    description:
      'The dialog never closes by itself; the handler closes it after a successful save.',
    render: () => <NewClient />,
  },
  {
    title: 'Discard guard',
    description: 'Closing after editing asks for confirmation first.',
    render: () => <NewClient confirmDiscard />,
  },
  {
    title: 'Arabic',
    render: () => (
      <FormDialog
        trigger={<Button>عميل جديد</Button>}
        title="عميل جديد"
        description="أضف عميلًا إلى الدليل."
        onSubmit={() => {}}
        confirmDiscard
      >
        <Field label="الاسم" required>
          <Input name="name" />
        </Field>
      </FormDialog>
    ),
  },
];
