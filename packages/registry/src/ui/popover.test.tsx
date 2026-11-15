import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { expectNoA11yViolations } from '@/test/a11y';

function Example() {
  return (
    <Popover>
      <PopoverTrigger>Filters</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Filter rows</PopoverTitle>
        <PopoverDescription>Choose a status</PopoverDescription>
        <input aria-label="Status" />
      </PopoverContent>
    </Popover>
  );
}

describe('Popover', () => {
  it('opens on click with a name and description', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const dialog = await screen.findByRole('dialog', { name: 'Filter rows' });
    expect(dialog).toHaveAccessibleDescription('Choose a status');
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});
