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
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

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

  it('variant="destructive" is the same as the destructive prop', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive">Revoke</DropdownMenuItem>
          <DropdownMenuItem>Plain</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const revoke = await screen.findByRole('menuitem', { name: 'Revoke' });
    expect(revoke).toHaveClass('text-danger');
    expect(revoke).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByRole('menuitem', { name: 'Plain' })).toHaveAttribute(
      'data-variant',
      'default',
    );
  });

  it('inset indents items, labels and sub triggers on the start side', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Section</DropdownMenuLabel>
            <DropdownMenuItem inset>Indented</DropdownMenuItem>
            <DropdownMenuItem>Flush</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Nested</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const indented = await screen.findByRole('menuitem', { name: 'Indented' });
    expect(indented).toHaveAttribute('data-inset');
    expect(indented).toHaveClass('data-[inset]:ps-8');
    expect(screen.getByRole('menuitem', { name: 'Flush' })).not.toHaveAttribute('data-inset');
    expect(screen.getByText('Section')).toHaveAttribute('data-inset');
    expect(screen.getByRole('menuitem', { name: 'More' })).toHaveAttribute('data-inset');
  });

  it('shows a shortcut hint at the end of an item', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Search <DropdownMenuShortcut>Ctrl K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const hint = await screen.findByText('Ctrl K');
    expect(hint).toHaveAttribute('data-slot', 'dropdown-menu-shortcut');
    expect(hint).toHaveClass('ms-auto');
    expect(hint).toHaveAttribute('dir', 'ltr');
  });

  it('opens a submenu from its trigger and runs a nested item', async () => {
    const onPick = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={onPick}>Email</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const trigger = await screen.findByRole('menuitem', { name: 'Share' });
    expect(screen.queryByRole('menuitem', { name: 'Email' })).not.toBeInTheDocument();
    await userEvent.click(trigger);
    const nested = await screen.findByRole('menuitem', { name: 'Email' });
    expect(nested.closest('[data-slot="dropdown-menu-sub-content"]')).not.toBeNull();
    await userEvent.click(nested);
    expect(onPick).toHaveBeenCalledOnce();
  });

  it('opens the submenu with the arrow key that points to the end edge, in both directions', async () => {
    const tree = (
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const english = renderWithLocale(tree, { locale: 'en' });
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const trigger = await screen.findByRole('menuitem', { name: 'Share' });
    trigger.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByRole('menuitem', { name: 'Email' })).toBeInTheDocument();
    english.unmount();

    renderWithLocale(tree, { locale: 'ar' });
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const arabicTrigger = await screen.findByRole('menuitem', { name: 'Share' });
    arabicTrigger.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(await screen.findByRole('menuitem', { name: 'Email' })).toBeInTheDocument();
  });

  it('has no axe violations with a submenu open', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Share' }));
    await screen.findByRole('menuitem', { name: 'Email' });
    await expectNoA11yViolations();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await screen.findByRole('menu');
    await expectNoA11yViolations();
  });
});
