import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import type { Example } from '../example-types';

function Controlled() {
  const [on, setOn] = useState(true);
  return (
    <Switch
      checked={on}
      onCheckedChange={setOn}
      label="Email notifications"
      description={on ? 'You will get a summary each morning' : 'Notifications are paused'}
    />
  );
}

export const examples: Example[] = [
  { title: 'With a label', render: () => <Controlled /> },
  {
    title: 'Bare switch with an accessible name',
    render: () => <Switch aria-label="Dark mode" />,
  },
  {
    title: 'States',
    render: () => (
      <>
        <Switch label="Off" />
        <Switch label="On" defaultChecked />
        <Switch label="Disabled" disabled />
        <Switch label="Disabled on" disabled defaultChecked />
      </>
    ),
  },
  {
    title: 'In a field, invalid',
    render: () => (
      <Field
        label="Terms of service"
        description="Required to create the account"
        error="You must accept the terms"
        className="w-72"
      >
        <Switch />
      </Field>
    ),
  },
  {
    title: 'Arabic (thumb slides toward the end)',
    render: () => (
      <>
        <Switch label="الإشعارات" description="تنبيهات البريد الإلكتروني" />
        <Switch label="مفعّل" defaultChecked />
      </>
    ),
  },
];
