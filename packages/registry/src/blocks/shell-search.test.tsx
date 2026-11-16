import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { navSearchItems, ShellSearch, type SearchItem } from '@/components/blocks/shell-search';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const items: SearchItem[] = [
  { id: 'dash', label: 'Dashboard', group: 'Pages' },
  { id: 'inv', label: 'Invoices', group: 'Pages', keywords: ['billing'] },
  { id: 'new', label: 'Create invoice', group: 'Actions' },
];

describe('ShellSearch', () => {
  it('opens from the button, filters and selects an item', async () => {
    const onSelect = vi.fn();
    renderWithLocale(<ShellSearch items={items} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    const input = await screen.findByRole('combobox');
    await userEvent.type(input, 'billing');
    expect(screen.queryByRole('option', { name: 'Dashboard' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Invoices' }));
    expect(onSelect).toHaveBeenCalledWith(items[1]);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('toggles with Ctrl+K and Cmd+K', async () => {
    renderWithLocale(<ShellSearch items={items} onSelect={() => {}} />);
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  it('shows the empty message and the loading row', async () => {
    const { rerender } = renderWithLocale(<ShellSearch items={[]} onSelect={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('No results found.')).toBeInTheDocument();
    rerender(<ShellSearch items={[]} loading onSelect={() => {}} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('can be controlled', async () => {
    const onOpenChange = vi.fn();
    renderWithLocale(
      <ShellSearch items={items} open={false} onOpenChange={onOpenChange} onSelect={() => {}} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('builds palette items from the navigable entries of a nav tree', () => {
    expect(
      navSearchItems(
        [
          { id: 'a', label: 'A', href: '/a' },
          { id: 'g', label: 'G', children: [{ id: 'b', label: 'B', href: '/b' }] },
          { id: 'x', label: 'X', href: '/x', disabled: true },
        ],
        'Pages',
      ).map((item) => [item.id, item.group]),
    ).toEqual([
      ['a', 'Pages'],
      ['b', 'Pages'],
    ]);
  });

  it('renders Arabic labels', async () => {
    renderWithLocale(<ShellSearch items={items} onSelect={() => {}} />, { locale: 'ar' });
    await userEvent.click(screen.getByRole('button', { name: 'بحث' }));
    expect(await screen.findByRole('dialog', { name: 'البحث والأوامر' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<ShellSearch items={items} onSelect={() => {}} />);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('combobox');
    await expectNoA11yViolations(document.body);
  });
});
