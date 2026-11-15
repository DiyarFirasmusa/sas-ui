import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterBar, type FilterBarProps } from '@/components/ui/filter-bar';
import type { FilterDefinition, FilterValues } from '@/lib/filter-state';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const filters: FilterDefinition[] = [
  { key: 'name', type: 'text', label: 'Name', group: 'General' },
  {
    key: 'tags',
    type: 'multi-select',
    label: 'Tags',
    group: 'General',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ],
  },
  { key: 'price', type: 'number-range', label: 'Price', group: 'Details' },
  { key: 'created', type: 'date-range', label: 'Created', group: 'Details' },
];

function Harness({
  initial = {},
  onChange,
  ...props
}: {
  initial?: FilterValues;
  onChange?: (value: FilterValues) => void;
} & Partial<FilterBarProps>) {
  const [value, setValue] = useState<FilterValues>(initial);
  return (
    <FilterBar
      filters={filters}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      {...props}
    />
  );
}

async function openPanel() {
  await userEvent.click(screen.getByRole('button', { name: /^Filters/ }));
  return screen.findByRole('dialog', { name: 'Filters' });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('FilterBar search', () => {
  it('debounces typing into one onChange', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onChange = vi.fn();
    render(<Harness onChange={onChange} searchDelay={300} />);
    const box = screen.getByRole('searchbox', { name: 'Search' });
    await userEvent.type(box, 'hotel', {
      advanceTimers: vi.advanceTimersByTime,
    });
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ q: 'hotel' });
  });

  it('submits immediately on Enter', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} searchDelay={5000} />);
    await userEvent.type(screen.getByRole('searchbox'), 'abc{Enter}');
    expect(onChange).toHaveBeenCalledWith({ q: 'abc' });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('clears the search with the clear button', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ q: 'hotel', name: 'Ali' }} onChange={onChange} />);
    expect(screen.getByRole('searchbox')).toHaveValue('hotel');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith({ name: 'Ali' });
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('follows the value when it changes from outside', async () => {
    const { rerender } = render(
      <FilterBar filters={filters} value={{ q: 'one' }} onChange={() => {}} />,
    );
    rerender(<FilterBar filters={filters} value={{ q: 'two' }} onChange={() => {}} />);
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveValue('two'));
  });

  it('uses a custom search key and placeholder', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} searchKey="search" searchPlaceholder="Find trips" />);
    expect(screen.getByPlaceholderText('Find trips')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'x{Enter}');
    expect(onChange).toHaveBeenCalledWith({ search: 'x' });
  });

  it('does not count the search as a filter', () => {
    render(<Harness initial={{ q: 'hotel' }} />);
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
  });
});

describe('FilterBar panel', () => {
  it('opens a labelled dialog with filters grouped by section', async () => {
    render(<Harness />);
    const panel = await openPanel();
    expect(within(panel).getByRole('heading', { name: 'General' })).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: 'Details' })).toBeInTheDocument();
    expect(within(panel).getByLabelText('Name')).toBeInTheDocument();
    expect(within(panel).getByRole('group', { name: 'Tags' })).toBeInTheDocument();
    expect(within(panel).getByRole('group', { name: 'Created' })).toBeInTheDocument();
  });

  it('applies the edited filters together and closes', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ q: 'x' }} onChange={onChange} />);
    const panel = await openPanel();
    await userEvent.type(within(panel).getByLabelText('Name'), 'Ali');
    await userEvent.click(within(panel).getByRole('checkbox', { name: 'Beta' }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ q: 'x', name: 'Ali', tags: ['b'] });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('applies with Enter from a text field', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const panel = await openPanel();
    await userEvent.type(within(panel).getByLabelText('Name'), 'Ali{Enter}');
    expect(onChange).toHaveBeenCalledWith({ name: 'Ali' });
  });

  it('discards edits when closed with Escape', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const panel = await openPanel();
    await userEvent.type(within(panel).getByLabelText('Name'), 'Ali');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
    const again = await openPanel();
    expect(within(again).getByLabelText('Name')).toHaveValue('');
  });

  it('starts from the applied values and resets the draft', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ name: 'Ali', tags: ['a'] }} onChange={onChange} />);
    const panel = await openPanel();
    expect(within(panel).getByLabelText('Name')).toHaveValue('Ali');
    expect(within(panel).getByRole('checkbox', { name: 'Alpha' })).toBeChecked();
    await userEvent.click(within(panel).getByRole('button', { name: 'Reset' }));
    expect(within(panel).getByLabelText('Name')).toHaveValue('');
    await userEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it('accepts range values and drops invalid ones', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const panel = await openPanel();
    const price = within(within(panel).getByRole('group', { name: 'Price' }));
    await userEvent.type(price.getByLabelText('Min'), '10');
    await userEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({ price: { min: 10 } });
  });

  it('hides the Filters button when there are no filters', () => {
    render(<Harness filters={[]} />);
    expect(screen.queryByRole('button', { name: /Filters/ })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });
});

describe('FilterBar chips', () => {
  const initial: FilterValues = {
    q: 'hotel',
    name: 'Ali',
    tags: ['a', 'b'],
    price: { min: 5, max: 9 },
    created: { from: '2024-01-01' },
  };

  it('shows a count badge and one chip per value', () => {
    render(<Harness initial={initial} />);
    expect(screen.getByRole('button', { name: 'Filters (4)' })).toBeInTheDocument();
    const chips = within(screen.getByRole('list', { name: 'Active filters' })).getAllByRole(
      'listitem',
    );
    expect(chips.map((chip) => chip.textContent)).toEqual([
      'Name:Ali',
      'Tags:Alpha',
      'Tags:Beta',
      'Price:5 – 9',
      'Created:From 2024-01-01',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('4 filters applied');
  });

  it('removes one chip and keeps the others', async () => {
    const onChange = vi.fn();
    render(<Harness initial={initial} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Tags: Alpha' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...initial, tags: ['b'] });
    expect(
      screen.queryByRole('button', { name: 'Remove filter Tags: Alpha' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters (4)' })).toBeInTheDocument();
  });

  it('moves focus to a remaining chip after removing one', async () => {
    render(<Harness initial={initial} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Name: Ali' }));
    expect(screen.getByRole('button', { name: 'Remove filter Tags: Alpha' })).toHaveFocus();
  });

  it('clears all filters but keeps the search', async () => {
    const onChange = vi.fn();
    render(<Harness initial={initial} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith({ q: 'hotel' });
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
    expect(screen.getByRole('searchbox')).toHaveValue('hotel');
  });

  it('is operable from the keyboard', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ name: 'Ali' }} onChange={onChange} />);
    screen.getByRole('button', { name: 'Remove filter Name: Ali' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith({});
  });
});

describe('FilterBar states', () => {
  it('shows a busy button while the metadata loads and does not open', async () => {
    render(<Harness loading />);
    const button = screen.getByRole('button', { name: 'Filters' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the error with a retry in the panel', async () => {
    const onRetry = vi.fn();
    render(<Harness filters={[]} error onRetry={onRetry} />);
    const panel = await openPanel();
    expect(within(panel).getByRole('alert')).toHaveTextContent('Could not load the filters.');
    await userEvent.click(within(panel).getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('FilterBar locale and accessibility', () => {
  it('localises everything to Arabic and keeps Latin digits in the badge', async () => {
    renderWithLocale(<Harness initial={{ name: 'علي', tags: ['a'] }} />, {
      locale: 'ar',
    });
    expect(screen.getByRole('searchbox', { name: 'بحث' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'التصفية (2)' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'عوامل التصفية المفعّلة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'مسح الكل' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('تم تطبيق 2 من عوامل التصفية');
    await userEvent.click(screen.getByRole('button', { name: /^التصفية/ }));
    const panel = await screen.findByRole('dialog', { name: 'التصفية' });
    expect(within(panel).getByRole('button', { name: 'تطبيق' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'إعادة تعيين' })).toBeInTheDocument();
  });

  it('accepts label overrides', () => {
    render(<Harness labels={{ filters: 'Refine', search: 'Find' }} />);
    expect(screen.getByRole('button', { name: 'Refine' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Find' })).toBeInTheDocument();
  });

  it('has no axe violations with chips', async () => {
    const { container } = render(<Harness initial={{ name: 'Ali', tags: ['a'], q: 'x' }} />);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations with the panel open', async () => {
    render(<Harness initial={{ name: 'Ali' }} />);
    await openPanel();
    await expectNoA11yViolations();
  });

  it('has no axe violations while loading', async () => {
    const { container } = render(<Harness loading />);
    await expectNoA11yViolations(container);
  });
});
