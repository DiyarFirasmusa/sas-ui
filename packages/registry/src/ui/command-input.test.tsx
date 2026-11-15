import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Command } from '@/components/ui/command';
import { CommandInput } from '@/components/ui/command-input';
import { CommandItem } from '@/components/ui/command-item';
import { CommandList } from '@/components/ui/command-list';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Palette({ onKeyDown }: { onKeyDown?: React.KeyboardEventHandler<HTMLInputElement> }) {
  return (
    <Command>
      <CommandInput onKeyDown={onKeyDown} />
      <CommandList>
        <CommandItem>One</CommandItem>
        <CommandItem>Two</CommandItem>
      </CommandList>
    </Command>
  );
}

describe('CommandInput', () => {
  it('is a labelled combobox with a placeholder', () => {
    render(<Palette />);
    const input = screen.getByRole('combobox', { name: 'Search' });
    expect(input).toHaveAttribute('placeholder', 'Type a command or search…');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('accepts a custom label and placeholder', () => {
    render(
      <Command>
        <CommandInput label="Find" placeholder="Look" />
      </Command>,
    );
    expect(screen.getByRole('combobox', { name: 'Find' })).toHaveAttribute('placeholder', 'Look');
  });

  it('moves the active option with the arrow keys', async () => {
    render(<Palette />);
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    expect(screen.getByRole('option', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}{Home}');
    expect(screen.getByRole('option', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });

  it('lets a handler prevent the built-in keys', async () => {
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => event.preventDefault());
    render(<Palette onKeyDown={onKeyDown} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{ArrowDown}');
    expect(onKeyDown).toHaveBeenCalled();
    expect(screen.getByRole('option', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });

  it('is localised in Arabic and has no axe violations', async () => {
    const { container } = renderWithLocale(<Palette />, { locale: 'ar' });
    expect(screen.getByRole('combobox', { name: 'بحث' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
