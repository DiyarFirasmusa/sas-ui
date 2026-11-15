import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from '@/components/ui/combobox';
import { Field } from '@/components/ui/field';
import type { ComboboxOption } from '@/lib/combobox-options';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const countries: ComboboxOption[] = [
  { value: 'eg', label: 'Egypt' },
  { value: 'iq', label: 'Iraq' },
  { value: 'jo', label: 'Jordan' },
  { value: 'kw', label: 'Kuwait', disabled: true },
];

describe('Combobox (static options)', () => {
  it('filters as you type and selects by click', async () => {
    const onValueChange = vi.fn();
    render(<Combobox aria-label="Country" options={countries} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Country' });
    await userEvent.click(input);
    expect(await screen.findAllByRole('option')).toHaveLength(4);
    await userEvent.type(input, 'ir');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    await userEvent.click(screen.getByRole('option', { name: 'Iraq' }));
    expect(onValueChange).toHaveBeenCalledWith('iq');
    expect(input).toHaveValue('Iraq');
  });

  it('shows the empty state when nothing matches', async () => {
    render(<Combobox aria-label="Country" options={countries} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('shows the initial value and supports a controlled value', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('jo');
      return (
        <>
          <Combobox aria-label="Country" options={countries} value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue('eg')}>
            set
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('combobox')).toHaveValue('Jordan');
    await userEvent.click(screen.getByRole('button', { name: 'set' }));
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('Egypt'));
  });

  it('clears the selection when clearable', async () => {
    const onValueChange = vi.fn();
    render(
      <Combobox aria-label="Country" options={countries} defaultValue="eg" clearable onValueChange={onValueChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('marks disabled options and does not select them', async () => {
    const onValueChange = vi.fn();
    render(<Combobox aria-label="Country" options={countries} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    const option = await screen.findByRole('option', { name: 'Kuwait' });
    expect(option).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(option);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('opens from the keyboard and closes with Escape', async () => {
    render(<Combobox aria-label="Country" options={countries} />);
    await userEvent.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('cannot be used when disabled', async () => {
    render(<Combobox aria-label="Country" options={countries} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('forwards ref to the input, name and onBlur', async () => {
    const ref = createRef<HTMLInputElement>();
    const onBlur = vi.fn();
    const { container } = render(
      <Combobox aria-label="Country" options={countries} ref={ref} name="country" defaultValue="eg" onBlur={onBlur} />,
    );
    expect(ref.current).toBe(screen.getByRole('combobox'));
    expect(container.querySelector('input[name="country"]')).toHaveValue('eg');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Escape}');
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('works inside Field and shows the invalid state', () => {
    render(
      <Field label="Country" error="Pick a country">
        <Combobox options={countries} />
      </Field>,
    );
    const input = screen.getByRole('combobox', { name: 'Country' });
    expect(input).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a country');
  });

  it('reflects aria-invalid passed directly', () => {
    render(<Combobox aria-label="Country" options={countries} aria-invalid />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows Arabic labels and follows the typed Arabic text', async () => {
    const arabic = [
      { value: 'eg', label: 'مصر' },
      { value: 'iq', label: 'العراق' },
    ];
    renderWithLocale(<Combobox aria-label="الدولة" options={arabic} clearable />, { locale: 'ar' });
    const input = screen.getByRole('combobox', { name: 'الدولة' });
    expect(screen.getByRole('button', { name: 'فتح الخيارات' })).toBeInTheDocument();
    await userEvent.type(input, 'عرا');
    expect(input).toHaveAttribute('dir', 'auto');
    await userEvent.click(await screen.findByRole('option', { name: 'العراق' }));
    expect(input).toHaveValue('العراق');
    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    await userEvent.type(input, 'سوريا');
    expect(await screen.findByText('لا توجد نتائج')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Country" description="Where you live">
        <Combobox options={countries} clearable />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('Combobox (async)', () => {
  it('reports the typed query and shows what the caller returns', async () => {
    const onSearchChange = vi.fn();
    function Remote() {
      const [options, setOptions] = useState<ComboboxOption[]>([]);
      return (
        <Combobox
          aria-label="User"
          options={options}
          onSearchChange={(query) => {
            onSearchChange(query);
            setOptions(query === 'ah' ? [{ value: '1', label: 'Ahmed' }] : []);
          }}
        />
      );
    }
    render(<Remote />);
    await userEvent.type(screen.getByRole('combobox'), 'ah');
    expect(onSearchChange).toHaveBeenLastCalledWith('ah');
    await userEvent.click(await screen.findByRole('option', { name: 'Ahmed' }));
    expect(screen.getByRole('combobox')).toHaveValue('Ahmed');
  });

  it('does not filter locally while searching remotely', async () => {
    render(
      <Combobox
        aria-label="User"
        options={[{ value: '1', label: 'Ahmed' }]}
        onSearchChange={() => {}}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(await screen.findByRole('option', { name: 'Ahmed' })).toBeInTheDocument();
  });

  it('keeps the chosen label after new results replace the options', async () => {
    const first = [{ value: '1', label: 'Ahmed' }];
    const second = [{ value: '2', label: 'Sara' }];
    const { rerender } = render(
      <Combobox aria-label="User" options={first} onSearchChange={() => {}} />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Ahmed' }));
    rerender(<Combobox aria-label="User" options={second} onSearchChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('Ahmed');
  });

  it('resolves the label of a saved value from fallbackOptions', () => {
    render(
      <Combobox
        aria-label="User"
        options={[]}
        defaultValue="7"
        fallbackOptions={[{ value: '7', label: 'Layla' }]}
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByRole('combobox')).toHaveValue('Layla');
  });

  it('asks for the unfiltered list again when the popup closes after a search', async () => {
    const onSearchChange = vi.fn();
    render(<Combobox aria-label="User" options={[]} onSearchChange={onSearchChange} />);
    await userEvent.type(screen.getByRole('combobox'), 'ab');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(onSearchChange).toHaveBeenLastCalledWith(''));
  });

  it('shows a loading row and marks the popup busy', async () => {
    render(<Combobox aria-label="User" options={[]} onSearchChange={() => {}} loading />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('No results')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="combobox-content"]')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the error row with a retry button', async () => {
    const onRetry = vi.fn();
    render(
      <Combobox aria-label="User" options={[]} onSearchChange={() => {}} error onRetry={onRetry} />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByText('Could not load results')).toBeInTheDocument();
    expect(screen.queryByText('No results')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('lets callers override the state texts', async () => {
    render(
      <Combobox
        aria-label="User"
        options={[]}
        onSearchChange={() => {}}
        labels={{ empty: 'Nobody found' }}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByText('Nobody found')).toBeInTheDocument();
  });

  it('loads the next page from the button and when scrolled to the end', async () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <Combobox
        aria-label="User"
        options={[{ value: '1', label: 'Ahmed' }]}
        onSearchChange={() => {}}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    // jsdom has no layout: the scroll position is zero, which counts as "at the end".
    const scroller = screen.getByRole('listbox').parentElement;
    expect(scroller).not.toBeNull();
    if (scroller) {
      fireEvent.scroll(scroller);
    }
    expect(onLoadMore).toHaveBeenCalledTimes(2);

    rerender(
      <Combobox
        aria-label="User"
        options={[{ value: '1', label: 'Ahmed' }]}
        onSearchChange={() => {}}
        hasMore
        loading
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    if (scroller) {
      fireEvent.scroll(scroller);
    }
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('has no axe violations while open and loading', async () => {
    render(
      <Combobox aria-label="User" options={[{ value: '1', label: 'Ahmed' }]} onSearchChange={() => {}} loading />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    await expectNoA11yViolations(document.body);
  });
});
