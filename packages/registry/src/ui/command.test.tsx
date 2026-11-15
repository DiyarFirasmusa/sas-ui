import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  type CommandProps,
} from '@/components/ui/command';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Palette({
  onSelect = () => {},
  ...props
}: Partial<CommandProps> & { onSelect?: (value: string) => void }) {
  return (
    <Command {...props}>
      <CommandInput />
      <CommandList>
        <CommandEmpty />
        <CommandGroup heading="Files">
          <CommandItem onSelect={onSelect} shortcut={['Ctrl', 'N']}>
            New file
          </CommandItem>
          <CommandItem onSelect={onSelect}>Open file</CommandItem>
          <CommandItem onSelect={onSelect} disabled>
            Delete file
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={onSelect} keywords={['preferences']}>
            Open settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

const active = () =>
  document.getElementById(screen.getByRole('combobox').getAttribute('aria-activedescendant') ?? '');

describe('Command', () => {
  it('renders a combobox wired to a listbox of options', () => {
    render(<Palette />);
    const input = screen.getByRole('combobox', { name: 'Search' });
    const list = screen.getByRole('listbox', { name: 'Results' });
    expect(input).toHaveAttribute('aria-controls', list.id);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByRole('group', { name: 'Files' })).toBeInTheDocument();
  });

  it('highlights the first option and exposes it through aria-activedescendant', () => {
    render(<Palette />);
    expect(active()).toHaveTextContent('New file');
    expect(active()).toHaveAttribute('aria-selected', 'true');
  });

  it('moves with the arrow keys, skips disabled items and wraps around', async () => {
    render(<Palette />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('Open file');
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('Open settings');
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('New file');
    await userEvent.keyboard('{ArrowUp}');
    expect(active()).toHaveTextContent('Open settings');
  });

  it('jumps with Home and End', async () => {
    render(<Palette />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{End}');
    expect(active()).toHaveTextContent('Open settings');
    await userEvent.keyboard('{Home}');
    expect(active()).toHaveTextContent('New file');
  });

  it('selects the highlighted option with Enter', async () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('Open file');
  });

  it('selects with a click and ignores disabled items', async () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('option', { name: /Delete file/ }));
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('option', { name: 'Open settings' }));
    expect(onSelect).toHaveBeenCalledWith('Open settings');
  });

  it('highlights the hovered option', async () => {
    render(<Palette />);
    await userEvent.hover(screen.getByRole('option', { name: 'Open settings' }));
    expect(active()).toHaveTextContent('Open settings');
  });

  it('filters while typing, re-highlights the first match and hides empty groups', async () => {
    render(<Palette />);
    await userEvent.type(screen.getByRole('combobox'), 'open');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Open file',
      'Open settings',
    ]);
    expect(active()).toHaveTextContent('Open file');
    await userEvent.clear(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'settings');
    expect(screen.queryByRole('group', { name: 'Files' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Settings' })).toBeInTheDocument();
  });

  it('matches keywords', async () => {
    render(<Palette />);
    await userEvent.type(screen.getByRole('combobox'), 'prefer');
    expect(screen.getByRole('option', { name: 'Open settings' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('shows the empty state and drops the listbox when nothing matches', async () => {
    render(<Palette />);
    await userEvent.type(screen.getByRole('combobox'), 'zzzz');
    expect(screen.getByRole('status')).toHaveTextContent('No results found.');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');
    await userEvent.clear(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('accepts a custom filter function', async () => {
    const filter = vi.fn((value: string, search: string) => (value.startsWith(search) ? 1 : 0));
    render(<Palette filter={filter} />);
    await userEvent.type(screen.getByRole('combobox'), 'Open');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Open file',
      'Open settings',
    ]);
    await userEvent.type(screen.getByRole('combobox'), ' f');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(filter).toHaveBeenCalled();
  });

  it('can leave filtering to the caller', async () => {
    render(<Palette shouldFilter={false} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzzz');
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('supports a controlled search value', async () => {
    const onSearchChange = vi.fn();
    render(<Palette search="settings" onSearchChange={onSearchChange} />);
    expect(screen.getByRole('combobox')).toHaveValue('settings');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.type(screen.getByRole('combobox'), 's');
    expect(onSearchChange).toHaveBeenCalledWith('settingss');
  });

  it('shows shortcuts as key caps', () => {
    const { container } = render(<Palette />);
    const caps = container.querySelectorAll('[data-slot="command-item"] [data-slot="kbd"]');
    expect([...caps].map((cap) => cap.textContent)).toEqual(['Ctrl', 'N']);
  });

  it('renders a loading row', async () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandLoading />
        </CommandList>
      </Command>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    await expectNoA11yViolations();
  });

  it('localises labels and matches Arabic text without diacritics', async () => {
    renderWithLocale(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandEmpty />
          <CommandGroup heading="الملفات">
            <CommandItem>إنشاء ملف</CommandItem>
            <CommandItem>فتح ملف</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
      { locale: 'ar' },
    );
    const input = screen.getByRole('combobox', { name: 'بحث' });
    expect(input).toHaveAttribute('placeholder', 'اكتب أمراً أو ابحث…');
    expect(screen.getByRole('listbox', { name: 'النتائج' })).toBeInTheDocument();
    await userEvent.type(input, 'انشاء');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.clear(input);
    await userEvent.type(input, 'xyz');
    expect(screen.getByRole('status')).toHaveTextContent('لا توجد نتائج.');
  });

  it('has no axe violations (results, empty and loading)', async () => {
    render(<Palette />);
    await expectNoA11yViolations();
    await userEvent.type(screen.getByRole('combobox'), 'zzzz');
    await expectNoA11yViolations();
  });
});

describe('CommandDialog', () => {
  function DialogExample({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
    return (
      <CommandDialog open onOpenChange={onOpenChange}>
        <CommandInput />
        <CommandList>
          <CommandEmpty />
          <CommandItem>Open file</CommandItem>
          <CommandItem>Save file</CommandItem>
        </CommandList>
      </CommandDialog>
    );
  }

  it('opens as a named modal with the search focused', async () => {
    render(<DialogExample />);
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());
  });

  it('navigates and filters inside the dialog', async () => {
    render(<DialogExample />);
    await screen.findByRole('dialog');
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toHaveTextContent('Save file');
    await userEvent.keyboard('sav');
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('asks to close on Escape', async () => {
    const onOpenChange = vi.fn();
    render(<DialogExample onOpenChange={onOpenChange} />);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('is titled in Arabic', async () => {
    renderWithLocale(<DialogExample />, { locale: 'ar' });
    expect(await screen.findByRole('dialog', { name: 'لوحة الأوامر' })).toBeInTheDocument();
  });

  it('has no axe violations when open', async () => {
    render(<DialogExample />);
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});
