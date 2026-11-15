import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { expectNoA11yViolations } from '@/test/a11y';

function Example({ onDelete = () => {} }: { onDelete?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Row</DropdownMenuLabel>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuCheckboxItem defaultChecked>Pinned</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onClick={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('opens from the trigger and lists menu items', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Pinned' })).toBeChecked();
  });

  it('runs an item action and closes', async () => {
    const onDelete = vi.fn();
    render(<Example onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('closes with Escape', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await screen.findByRole('menu');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('styles destructive items with the danger token', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toHaveClass('text-danger');
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await screen.findByRole('menu');
    await expectNoA11yViolations();
  });
});
