import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Form, FormField, useZodForm } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { applyServerErrors } from '@/lib/form-errors';
import type { Example } from '../example-types';

const schema = z.object({
  name: z.string().min(2, 'Enter at least 2 characters'),
  email: z.email('Enter a valid email'),
  seats: z.number('Enter a number').min(1, 'At least 1 seat'),
  plan: z.string().min(1, 'Choose a plan'),
  country: z.string().min(1, 'Choose a country'),
  terms: z.boolean().refine((value) => value, 'You must accept the terms'),
});

const countries = [
  { value: 'eg', label: 'Egypt' },
  { value: 'iq', label: 'Iraq' },
  { value: 'jo', label: 'Jordan' },
];

/** What a backend might answer for a duplicate email. */
const serverResponse = {
  message: 'The account could not be created.',
  errors: [{ field: 'email', message: 'This email is already registered' }],
};

function SignUp({ simulateServerError }: { simulateServerError: boolean }) {
  const [saved, setSaved] = useState<string | null>(null);
  const form = useZodForm(schema, {
    defaultValues: {
      name: '',
      email: '',
      seats: 1,
      plan: '',
      country: '',
      terms: false,
    },
  });

  return (
    <Form
      form={form}
      className="w-80"
      onSubmit={async (values) => {
        setSaved(null);
        if (simulateServerError) {
          applyServerErrors(form.setError, serverResponse);
          return;
        }
        setSaved(`Saved ${values.name} with ${values.seats} seat(s)`);
      }}
    >
      <FormField
        control={form.control}
        name="name"
        label="Name"
        required
        render={({ field }) => <Input {...field} />}
      />
      <FormField
        control={form.control}
        name="email"
        label="Email"
        required
        render={({ field }) => <Input {...field} type="email" />}
      />
      <FormField
        control={form.control}
        name="seats"
        label="Seats"
        render={({ field }) => (
          <NumberInput
            ref={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            value={field.value}
            onValueChange={field.onChange}
            min={0}
          />
        )}
      />
      <FormField
        control={form.control}
        name="plan"
        label="Plan"
        render={({ field }) => (
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
          >
            <RadioGroupItem value="free" label="Free" />
            <RadioGroupItem value="pro" label="Pro" />
          </RadioGroup>
        )}
      />
      <FormField
        control={form.control}
        name="country"
        label="Country"
        render={({ field }) => (
          <Combobox
            ref={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            options={countries}
            value={field.value === '' ? null : field.value}
            onValueChange={(next) => field.onChange(next ?? '')}
            clearable
          />
        )}
      />
      <FormField
        control={form.control}
        name="terms"
        render={({ field }) => (
          <Switch
            ref={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            checked={field.value}
            onCheckedChange={field.onChange}
            label="I accept the terms"
          />
        )}
      />
      <Button type="submit" loading={form.formState.isSubmitting}>
        Create account
      </Button>
      {saved ? <p className="text-b2 text-text-secondary">{saved}</p> : null}
    </Form>
  );
}

export const examples: Example[] = [
  {
    title: 'Validation with zod',
    description: 'Submit empty to see inline errors and focus on the first invalid field.',
    render: () => <SignUp simulateServerError={false} />,
  },
  {
    title: 'Server errors mapped onto fields',
    description:
      'Fill the form correctly and submit: the simulated server rejects the email and sends a form-level message.',
    render: () => <SignUp simulateServerError />,
  },
];
