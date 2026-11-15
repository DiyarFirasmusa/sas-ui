import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '@/components/ui/input';
import { expectNoA11yViolations } from '@/test/a11y';

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

  it('has no axe violations', async () => {
    const { container } = render(<Input aria-label="Name" />);
    await expectNoA11yViolations(container);
  });
});
