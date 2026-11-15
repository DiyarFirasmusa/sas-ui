import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from '@/components/ui/select';
import { expectNoA11yViolations } from '@/test/a11y';

const options = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'void', label: 'Void', disabled: true },
];

describe('Select', () => {
  it('shows the placeholder, then the chosen label', async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        aria-label="Status"
        options={options}
        placeholder="Pick one"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Status' });
    expect(trigger).toHaveTextContent('Pick one');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Sent' }));
    expect(onValueChange).toHaveBeenCalledWith('sent', expect.anything());
    expect(trigger).toHaveTextContent('Sent');
  });

  it('opens from the keyboard and closes with Escape', async () => {
    render(<Select aria-label="Status" options={options} defaultValue="draft" />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('marks disabled options', async () => {
    render(<Select aria-label="Status" options={options} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('option', { name: 'Void' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Select aria-label="Status" options={options} />);
    await expectNoA11yViolations(container);
  });
});
