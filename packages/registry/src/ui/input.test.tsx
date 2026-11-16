import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input, controlClasses, controlSizeClasses } from '@/components/ui/input';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Input', () => {
  it('reports typing', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Name'), 'ab');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('keeps direction on the UI default for an empty controlled field', () => {
    render(<Input aria-label="Name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('dir');
  });

  it('switches to auto when a controlled value is present', () => {
    render(<Input aria-label="Name" value="سلام" onChange={() => {}} />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('dir', 'auto');
  });

  it('treats email, url and tel as latin content', () => {
    render(
      <>
        <Input aria-label="Mail" type="email" />
        <Input aria-label="Phone" type="tel" />
      </>,
    );
    expect(screen.getByLabelText('Mail')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByLabelText('Phone')).toHaveAttribute('dir', 'ltr');
  });

  it('can be disabled', () => {
    render(<Input aria-label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('keeps the 38px default and offers an opt-in 42px lg size', () => {
    render(
      <>
        <Input aria-label="Plain" />
        <Input aria-label="Large" size="lg" />
      </>,
    );
    expect(screen.getByLabelText('Plain')).toHaveClass('h-9.5');
    expect(screen.getByLabelText('Plain')).toHaveAttribute('data-size', 'default');
    const large = screen.getByLabelText('Large');
    expect(large).toHaveClass('h-10.5');
    expect(large).not.toHaveClass('h-9.5');
    expect(controlClasses).toContain('h-9.5');
    expect(controlSizeClasses.lg).toBe('h-10.5');
  });

  it('autoDirection={false} keeps the UI direction for typed and controlled text', async () => {
    render(
      <>
        <Input aria-label="Typed" autoDirection={false} />
        <Input aria-label="Controlled" autoDirection={false} value="سلام" onChange={() => {}} />
      </>,
    );
    await userEvent.type(screen.getByLabelText('Typed'), 'مرحبا');
    expect(screen.getByLabelText('Typed')).not.toHaveAttribute('dir');
    expect(screen.getByLabelText('Controlled')).not.toHaveAttribute('dir');
  });

  it('autoDirection={false} still forces latin content left-to-right', () => {
    render(<Input aria-label="Mail" type="email" autoDirection={false} />);
    expect(screen.getByLabelText('Mail')).toHaveAttribute('dir', 'ltr');
  });

  it('follows the typed Arabic under an RTL locale by default', async () => {
    renderWithLocale(<Input aria-label="الاسم" />, { locale: 'ar' });
    const input = screen.getByLabelText('الاسم');
    expect(input).not.toHaveAttribute('dir');
    await userEvent.type(input, 'سلام');
    expect(input).toHaveAttribute('dir', 'auto');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Input aria-label="Name" />);
    await expectNoA11yViolations(container);
  });
});
