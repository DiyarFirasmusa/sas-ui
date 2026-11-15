import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Command } from '@/components/ui/command';
import { CommandInput } from '@/components/ui/command-input';
import { CommandItem } from '@/components/ui/command-item';
import {
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandLoading,
  CommandSeparator,
} from '@/components/ui/command-list';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('command list parts', () => {
  it('renders a named listbox with grouped options', () => {
    render(
      <Command>
        <CommandList label="Things">
          <CommandGroup heading="Letters">
            <CommandItem>A</CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </CommandList>
      </Command>,
    );
    expect(screen.getByRole('listbox', { name: 'Things' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Letters' })).toBeInTheDocument();
  });

  it('shows the empty message and drops the listbox when nothing matches', async () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandEmpty />
          <CommandItem>Apple</CommandItem>
        </CommandList>
      </Command>,
    );
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('No results found.');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('hides a group whose items are all filtered out', async () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandGroup heading="Fruit">
            <CommandItem>Apple</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Veg">
            <CommandItem>Carrot</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    await userEvent.type(screen.getByRole('combobox'), 'car');
    expect(screen.queryByRole('group', { name: 'Fruit' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Veg' })).toBeInTheDocument();
  });

  it('renders a loading row with custom text', () => {
    render(
      <Command>
        <CommandList>
          <CommandLoading>Wait</CommandLoading>
        </CommandList>
      </Command>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Wait');
  });

  it('localises the empty and loading messages and has no axe violations', async () => {
    const { container } = renderWithLocale(
      <Command search="zzz" onSearchChange={() => {}}>
        <CommandList>
          <CommandEmpty />
          <CommandLoading />
        </CommandList>
      </Command>,
      { locale: 'ar' },
    );
    expect(screen.getByText('لا توجد نتائج.')).toBeInTheDocument();
    expect(screen.getByText('جارٍ التحميل…')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
