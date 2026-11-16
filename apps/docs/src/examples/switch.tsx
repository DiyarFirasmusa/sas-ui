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
    title: 'Small',
    render: () => (
      <>
        <Switch size="sm" label="Compact row" />
        <Switch size="sm" aria-label="Compact on" defaultChecked />
      </>
    ),
  },
  {
    title: 'Mirrored in Arabic (mirror)',
    description:
      'By default the track stays left-to-right, as the dashboards draw it: "on" is at the physical right in Arabic too. Pass mirror to slide "on" toward the end edge instead.',
    render: () => (
      <>
        <Switch label="مفعّل" defaultChecked />
        <Switch mirror label="مرآة" defaultChecked />
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
    title: 'Arabic',
    render: () => (
      <>
        <Switch label="الإشعارات" description="تنبيهات البريد الإلكتروني" />
        <Switch label="مفعّل" defaultChecked />
      </>
    ),
  },
];
