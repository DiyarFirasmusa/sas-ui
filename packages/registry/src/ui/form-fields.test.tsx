import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { Form, useZodForm } from '@/components/ui/form';
import {
  CheckboxField,
  DateField,
  FileField,
  NumberField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
  TimeField,
} from '@/components/ui/form-fields';
import { expectNoA11yViolations } from '@/test/a11y';

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  notes: z.string(),
  status: z.string().min(1, 'Pick a status'),
  quantity: z.number({ error: 'Quantity is required' }).min(1, 'At least 1'),
  active: z.boolean(),
  terms: z.boolean().refine((value) => value, 'Accept the terms'),
});

type Values = z.input<typeof schema>;

function Example({ onSubmit }: { onSubmit: (values: z.output<typeof schema>) => void }) {
  const form = useZodForm(schema, {
    defaultValues: {
      name: '',
      notes: '',
      status: '',
      quantity: null as unknown as number,
      active: false,
      terms: false,
    },
  });
  return (
    <Form form={form} onSubmit={onSubmit}>
      <TextField control={form.control} name="name" label="Name" required />
      <TextareaField control={form.control} name="notes" label="Notes" />
      <SelectField
        control={form.control}
        name="status"
        label="Status"
        options={[{ value: 'draft', label: 'Draft' }]}
        placeholder="Pick"
      />
      <NumberField control={form.control} name="quantity" label="Quantity" />
      <SwitchField control={form.control} name="active" label="Active" />
      <CheckboxField control={form.control} name="terms" label="I accept" />
      <button type="submit">Save</button>
    </Form>
  );
}

describe('bound form fields', () => {
  it('shows schema errors under each field after submit', async () => {
    render(<Example onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Name is too short')).toBeInTheDocument();
    expect(screen.getByText('Pick a status')).toBeInTheDocument();
    expect(screen.getByText('Accept the terms')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInvalid();
  });

  it('submits parsed values once every field is valid', async () => {
    const onSubmit = vi.fn();
    render(<Example onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/Name/), 'Layla');
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Draft' }));
    await userEvent.type(screen.getByLabelText('Quantity'), '3');
    await userEvent.click(screen.getByRole('switch', { name: 'Active' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'I accept' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      name: 'Layla',
      status: 'draft',
      quantity: 3,
      active: true,
      terms: true,
    });
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example onSubmit={vi.fn()} />);
    await expectNoA11yViolations(container);
  });
});

describe('typing', () => {
  it('accepts a plain useForm control too', () => {
    function Plain() {
      const form = useForm<Values>({ defaultValues: { name: 'x' } });
      return <TextField control={form.control} name="name" label="Plain" />;
    }
    render(<Plain />);
    expect(screen.getByLabelText('Plain')).toHaveValue('x');
  });
});

describe('date, time and file fields', () => {
  const pickerSchema = z.object({
    day: z.string().min(1, 'Pick a day'),
    at: z.string().min(1, 'Pick a time'),
    files: z.array(z.instanceof(File)).min(1, 'Attach a file'),
  });

  function Pickers({ onSubmit }: { onSubmit: () => void }) {
    const form = useZodForm(pickerSchema, {
      defaultValues: { day: '', at: '', files: [] },
    });
    return (
      <Form form={form} onSubmit={onSubmit}>
        <DateField control={form.control} name="day" label="Day" />
        <TimeField control={form.control} name="at" label="Time" />
        <FileField control={form.control} name="files" label="Files" />
        <button type="submit">Save</button>
      </Form>
    );
  }

  it('reports required errors for each picker', async () => {
    render(<Pickers onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Pick a day')).toBeInTheDocument();
    expect(screen.getByText('Pick a time')).toBeInTheDocument();
    expect(screen.getByText('Attach a file')).toBeInTheDocument();
  });
});
