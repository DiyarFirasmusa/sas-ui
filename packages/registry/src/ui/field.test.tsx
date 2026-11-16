import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Field + Input', () => {
  it('styles the label, description and error with the dashboards text tokens', () => {
    render(
      <Field label="Email" description="We never share it" error="Required">
        <Input name="email" />
      </Field>,
    );
    expect(screen.getByText('Email')).toHaveClass('text-label', 'text-text-primary');
    expect(screen.getByText('We never share it')).toHaveClass('text-b3', 'text-text-secondary');
    expect(screen.getByText('Required')).toHaveClass('text-b3', 'text-danger');
  });

  it('links label, description and control', async () => {
    render(
      <Field label="Email" description="We never share it" required>
        <Input name="email" type="email" />
      </Field>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAccessibleDescription('We never share it');
  });

  it('announces the error and marks the control invalid', () => {
    render(
      <Field label="Name" error="Name is required">
        <Input name="name" />
      </Field>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    expect(screen.getByLabelText('Name')).toBeInvalid();
  });

  it('uses the UI direction while empty and auto once typed', async () => {
    render(<Input aria-label="Title" />);
    const input = screen.getByLabelText('Title');
    expect(input).not.toHaveAttribute('dir');
    await userEvent.type(input, 'مرحبا');
    expect(input).toHaveAttribute('dir', 'auto');
  });

  it('forces latin content left-to-right', () => {
    render(<Input aria-label="Code" kind="latin" />);
    expect(screen.getByLabelText('Code')).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Name" description="Hint" error="Required">
        <Input />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
