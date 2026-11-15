import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example({ onDelete = () => {} }: { onDelete?: () => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger data-testid="area">Right-click here</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>File</ContextMenuLabel>
          <ContextMenuItem>Open</ContextMenuItem>
          <ContextMenuCheckboxItem defaultChecked>Pinned</ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Email</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem destructive onClick={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

async function openMenu() {
  await userEvent.pointer({
    keys: '[MouseRight]',
    target: screen.getByTestId('area'),
  });
  return screen.findByRole('menu');
}

describe('ContextMenu', () => {
  it('opens on right-click and lists the items', async () => {
    render(<Example />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await openMenu();
    expect(screen.getByRole('menuitem', { name: 'Open' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemcheckbox', { name: 'Pinned' })).toBeChecked();
    expect(screen.getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();
  });

  it('runs an item action and closes', async () => {
    const onDelete = vi.fn();
    render(<Example onDelete={onDelete} />);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('opens a submenu from its trigger', async () => {
    render(<Example />);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Share' }));
    expect(await screen.findByRole('menuitem', { name: 'Email' })).toBeInTheDocument();
  });

  it('closes with Escape', async () => {
    render(<Example />);
    await openMenu();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('styles destructive items with the danger token', async () => {
    render(<Example />);
    await openMenu();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('text-danger');
  });

  it('opens in an Arabic page', async () => {
    renderWithLocale(
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">منطقة</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>فتح</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
      { locale: 'ar' },
    );
    await openMenu();
    expect(screen.getByRole('menuitem', { name: 'فتح' })).toBeInTheDocument();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await openMenu();
    await expectNoA11yViolations();
  });
});
