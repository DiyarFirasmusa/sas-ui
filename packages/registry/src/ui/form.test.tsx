import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { Combobox } from '@/components/ui/combobox';
import { Form, FormField, useZodForm } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { applyServerErrors } from '@/lib/form-errors';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const messages = {
  en: {
    name: 'Name is required',
    email: 'Enter a valid email',
    age: 'Must be at least 18',
  },
  ar: {
    name: 'الاسم مطلوب',
    email: 'أدخل بريدًا إلكترونيًا صحيحًا',
    age: 'يجب ألا يقل العمر عن 18',
  },
};

function makeSchema(text: typeof messages.en) {
  return z.object({
    name: z.string().min(1, text.name),
    email: z.email(text.email),
    age: z.number(text.age).min(18, text.age),
    newsletter: z.boolean(),
  });
}

type Submit = (values: z.output<ReturnType<typeof makeSchema>>) => void | Promise<void>;

interface DemoProps {
  onSubmit: Submit;
  text?: typeof messages.en;
  serverPayload?: unknown;
  labels?: {
    name: string;
    email: string;
    age: string;
    newsletter: string;
    submit: string;
  };
}

function Demo({
  onSubmit,
  text = messages.en,
  serverPayload,
  labels = {
    name: 'Name',
    email: 'Email',
    age: 'Age',
    newsletter: 'Newsletter',
    submit: 'Save',
  },
}: DemoProps) {
  const form = useZodForm(makeSchema(text), {
    defaultValues: { name: '', email: '', age: 18, newsletter: false },
  });
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        await onSubmit(values);
        if (serverPayload !== undefined) {
          applyServerErrors(form.setError, serverPayload);
        }
      }}
    >
      <FormField
        control={form.control}
        name="name"
        label={labels.name}
        render={({ field }) => <Input {...field} />}
      />
      <FormField
        control={form.control}
        name="email"
        label={labels.email}
        render={({ field }) => <Input {...field} type="email" />}
      />
      <FormField
        control={form.control}
        name="age"
        label={labels.age}
        render={({ field }) => (
          <NumberInput
            ref={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
      <FormField
        control={form.control}
        name="newsletter"
        label={labels.newsletter}
        render={({ field }) => (
          <Switch
            ref={field.ref}
            name={field.name}
            onBlur={field.onBlur}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <button type="submit">{labels.submit}</button>
    </Form>
  );
}

describe('Form + useZodForm', () => {
  it('shows inline errors for an invalid submit and does not call onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<Demo onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInvalid();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
    // The first invalid field receives focus.
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('clears an error once the field becomes valid and submits parsed values', async () => {
    const onSubmit = vi.fn();
    render(<Demo onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Name is required');
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Layla');
    await waitFor(() => expect(screen.queryByText('Name is required')).not.toBeInTheDocument());
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'layla@example.com');
    await userEvent.click(screen.getByRole('switch'));
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: 'Layla',
      email: 'layla@example.com',
      age: 19,
      newsletter: true,
    });
  });

  it('validates a field when it loses focus (touched mode)', async () => {
    render(<Demo onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'nope');
    expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument();
    await userEvent.tab();
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
  });

  it('applies server errors inline and shows the form-level message', async () => {
    const onSubmit = vi.fn();
    render(
      <Demo
        onSubmit={onSubmit}
        serverPayload={{
          errors: [{ field: 'email', message: 'Email already registered' }],
          message: 'Could not save',
        }}
      />,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Layla');
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'layla@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid();
    const alerts = screen.getAllByRole('alert').map((node) => node.textContent);
    expect(alerts).toContain('Could not save');
    expect(alerts).toContain('Email already registered');
  });

  it('clears server errors on the next submit', async () => {
    let attempt = 0;
    function Retry() {
      const form = useZodForm(z.object({ email: z.string() }), {
        defaultValues: { email: 'a@b.co' },
      });
      return (
        <Form
          form={form}
          onSubmit={() => {
            attempt += 1;
            if (attempt === 1) {
              applyServerErrors(form.setError, {
                email: ['Taken'],
                message: 'Failed',
              });
            }
          }}
        >
          <FormField
            control={form.control}
            name="email"
            label="Email"
            render={({ field }) => <Input {...field} />}
          />
          <button type="submit">Send</button>
        </Form>
      );
    }
    render(<Retry />);
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Failed')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.queryByText('Failed')).not.toBeInTheDocument());
    expect(screen.queryByText('Taken')).not.toBeInTheDocument();
  });

  it('shows an explicit form-level error prop', () => {
    function Explicit() {
      const form = useZodForm(z.object({ a: z.string() }), {
        defaultValues: { a: '' },
      });
      return (
        <Form form={form} onSubmit={() => {}} error="Network unavailable">
          <span />
        </Form>
      );
    }
    render(<Explicit />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
  });

  it('works with radio group and combobox controls', async () => {
    const onSubmit = vi.fn();
    function Mixed() {
      const form = useZodForm(
        z.object({
          plan: z.string().min(1, 'Choose a plan'),
          country: z.string().min(1, 'Choose a country'),
        }),
        { defaultValues: { plan: '', country: '' } },
      );
      return (
        <Form form={form} onSubmit={onSubmit}>
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
                value={field.value === '' ? null : field.value}
                onValueChange={(next) => field.onChange(next ?? '')}
                options={[{ value: 'eg', label: 'Egypt' }]}
              />
            )}
          />
          <button type="submit">Go</button>
        </Form>
      );
    }
    render(<Mixed />);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(await screen.findByText('Choose a plan')).toBeInTheDocument();
    expect(screen.getByText('Choose a country')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
    await userEvent.click(screen.getByText('Pro'));
    await userEvent.click(screen.getByRole('combobox', { name: 'Country' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Egypt' }));
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ plan: 'pro', country: 'eg' });
  });

  it('renders Arabic schema messages and server errors in an RTL form', async () => {
    const onSubmit = vi.fn();
    renderWithLocale(
      <Demo
        onSubmit={onSubmit}
        text={messages.ar}
        labels={{
          name: 'الاسم',
          email: 'البريد',
          age: 'العمر',
          newsletter: 'النشرة',
          submit: 'حفظ',
        }}
        serverPayload={{
          email: ['هذا البريد مستخدم بالفعل'],
          message: 'تعذر الحفظ',
        }}
      />,
      { locale: 'ar' },
    );
    await userEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    expect(await screen.findByText('الاسم مطلوب')).toBeInTheDocument();
    expect(screen.getByText('أدخل بريدًا إلكترونيًا صحيحًا')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'الاسم' }), 'ليلى');
    await userEvent.type(screen.getByRole('textbox', { name: 'البريد' }), 'layla@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'حفظ' }));
    expect(await screen.findByText('هذا البريد مستخدم بالفعل')).toBeInTheDocument();
    expect(screen.getByText('تعذر الحفظ')).toBeInTheDocument();
  });

  it('has no axe violations with errors showing', async () => {
    const { container } = render(<Demo onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Name is required');
    await expectNoA11yViolations(container);
  });
});
