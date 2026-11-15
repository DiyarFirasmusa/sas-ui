import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Command } from '@/components/ui/command';
import { CommandInput } from '@/components/ui/command-input';
import { CommandItem, CommandShortcut } from '@/components/ui/command-item';
import { CommandList } from '@/components/ui/command-list';
import { expectNoA11yViolations } from '@/test/a11y';

describe('CommandItem', () => {
  it('selects with its text on click', async () => {
    const onSelect = vi.fn();
    render(
      <Command>
        <CommandList>
          <CommandItem onSelect={onSelect}>Open</CommandItem>
        </CommandList>
      </Command>,
    );
    await userEvent.click(screen.getByRole('option', { name: 'Open' }));
    expect(onSelect).toHaveBeenCalledWith('Open');
  });

  it('uses an explicit value and ignores disabled items', async () => {
    const onSelect = vi.fn();
    render(
      <Command>
        <CommandList>
          <CommandItem value="x" onSelect={onSelect}>
            <span>Icon item</span>
          </CommandItem>
          <CommandItem disabled onSelect={onSelect}>
            Off
          </CommandItem>
        </CommandList>
      </Command>,
    );
    await userEvent.click(screen.getByRole('option', { name: 'Icon item' }));
    await userEvent.click(screen.getByRole('option', { name: 'Off' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('x');
    expect(screen.getByRole('option', { name: 'Off' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('is filtered by value and keywords', async () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem keywords={['prefs']}>Settings</CommandItem>
          <CommandItem>Files</CommandItem>
        </CommandList>
      </Command>,
    );
    await userEvent.type(screen.getByRole('combobox'), 'prefs');
    expect(screen.getByRole('option', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Files' })).not.toBeInTheDocument();
  });

  it('renders shortcut key caps and has no axe violations', async () => {
    const { container } = render(
      <Command>
        <CommandList>
          <CommandItem shortcut={['Ctrl', 'K']}>Search</CommandItem>
          <CommandItem>
            Other <CommandShortcut keys={['Esc']} />
          </CommandItem>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
