import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { MultiSelect } from '@/components/ui/multi-select';
import type { ComboboxOption } from '@/lib/combobox-options';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const tags: ComboboxOption[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'billing', label: 'Billing' },
  { value: 'legal', label: 'Legal' },
  { value: 'hr', label: 'HR', disabled: true },
];

describe('MultiSelect (static options)', () => {
  it('selects several options and shows them as chips', async () => {
    const onValueChange = vi.fn();
    render(<MultiSelect aria-label="Tags" options={tags} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Tags' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Urgent' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['urgent']);
    await userEvent.click(await screen.findByRole('option', { name: 'Legal' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['urgent', 'legal']);
    expect(screen.getByRole('button', { name: 'Remove Urgent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Legal' })).toBeInTheDocument();
  });

  it('removes a value with its chip button', async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        aria-label="Tags"
        options={tags}
        defaultValue={['urgent', 'billing']}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Urgent' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['billing']);
    expect(screen.queryByRole('button', { name: 'Remove Urgent' })).not.toBeInTheDocument();
  });

  it('removes the last chip with Backspace', async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        aria-label="Tags"
        options={tags}
        defaultValue={['urgent', 'billing']}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(['urgent']);
  });

  it('works controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState<string[]>(['legal']);
      return (
        <>
          <MultiSelect aria-label="Tags" options={tags} value={value} onValueChange={setValue} />
          <p>{`value:${value.join(',')}`}</p>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Billing' }));
    expect(screen.getByText('value:legal,billing')).toBeInTheDocument();
  });

  it('collapses extra chips into +N and expands on demand', async () => {
    render(
      <MultiSelect
        aria-label="Tags"
        options={tags}
        defaultValue={['urgent', 'billing', 'legal']}
        maxChips={1}
      />,
    );
    expect(screen.getByRole('button', { name: 'Remove Urgent' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Billing' })).not.toBeInTheDocument();
    const more = screen.getByRole('button', { name: 'Show 2 more' });
    expect(more).toHaveTextContent('+2');
    await userEvent.click(more);
    expect(screen.getByRole('button', { name: 'Remove Legal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not show +N when everything fits', () => {
    render(<MultiSelect aria-label="Tags" options={tags} defaultValue={['urgent']} maxChips={2} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('clears everything when clearable', async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        aria-label="Tags"
        options={tags}
        defaultValue={['urgent', 'billing']}
        clearable
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('filters locally and shows the empty state', async () => {
    render(<MultiSelect aria-label="Tags" options={tags} />);
    await userEvent.type(screen.getByRole('combobox'), 'leg');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    await userEvent.clear(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('opens with the keyboard and closes with Escape', async () => {
    render(<MultiSelect aria-label="Tags" options={tags} />);
    await userEvent.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('cannot be used when disabled', async () => {
    render(<MultiSelect aria-label="Tags" options={tags} defaultValue={['urgent']} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('forwards ref to the input, name, and fires onBlur only when leaving the control', async () => {
    const ref = createRef<HTMLInputElement>();
    const onBlur = vi.fn();
    const { container } = render(
      <>
        <MultiSelect
          aria-label="Tags"
          options={tags}
          ref={ref}
          name="tags"
          defaultValue={['urgent', 'billing']}
          onBlur={onBlur}
        />
        <button type="button">next</button>
      </>,
    );
    expect(ref.current).toBe(screen.getByRole('combobox'));
    expect(container.querySelectorAll('input[name="tags"]')).toHaveLength(2);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Escape}');
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'next' }));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('works inside Field and shows the invalid state', () => {
    render(
      <Field label="Tags" error="Pick at least one">
        <MultiSelect options={tags} />
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: 'Tags' })).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Pick at least one');
  });

  it('uses Arabic labels', async () => {
    const arabic = [
      { value: 'a', label: 'عاجل' },
      { value: 'b', label: 'مالي' },
      { value: 'c', label: 'قانوني' },
    ];
    renderWithLocale(
      <MultiSelect aria-label="الوسوم" options={arabic} defaultValue={['a', 'b', 'c']} maxChips={1} clearable />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('button', { name: 'إزالة عاجل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'عرض 2 أخرى' })).toHaveTextContent('+2');
    expect(screen.getByRole('button', { name: 'مسح الكل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'فتح الخيارات' })).toBeInTheDocument();
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(await screen.findByText('لا توجد نتائج')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Tags" description="Used for routing">
        <MultiSelect options={tags} defaultValue={['urgent', 'billing', 'legal']} maxChips={2} clearable />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('MultiSelect (async)', () => {
  it('reports queries and keeps chosen labels when results change', async () => {
    const onSearchChange = vi.fn();
    function Remote() {
      const [options, setOptions] = useState<ComboboxOption[]>([{ value: '1', label: 'Ahmed' }]);
      return (
        <MultiSelect
          aria-label="People"
          options={options}
          onSearchChange={(query) => {
            onSearchChange(query);
            setOptions(query === 'sa' ? [{ value: '2', label: 'Sara' }] : [{ value: '1', label: 'Ahmed' }]);
          }}
        />
      );
    }
    render(<Remote />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Ahmed' }));
    await userEvent.type(screen.getByRole('combobox'), 'sa');
    expect(onSearchChange).toHaveBeenCalledWith('sa');
    await userEvent.click(await screen.findByRole('option', { name: 'Sara' }));
    expect(screen.getByRole('button', { name: 'Remove Ahmed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Sara' })).toBeInTheDocument();
  });

  it('shows chips for saved values through fallbackOptions', () => {
    render(
      <MultiSelect
        aria-label="People"
        options={[]}
        defaultValue={['7']}
        fallbackOptions={[{ value: '7', label: 'Layla' }]}
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Remove Layla' })).toBeInTheDocument();
  });

  it('shows loading, error with retry, and load more', async () => {
    const onRetry = vi.fn();
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <MultiSelect aria-label="People" options={[]} onSearchChange={() => {}} loading />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByText('Loading…')).toBeInTheDocument();

    rerender(<MultiSelect aria-label="People" options={[]} onSearchChange={() => {}} error onRetry={onRetry} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <MultiSelect
        aria-label="People"
        options={[{ value: '1', label: 'Ahmed' }]}
        onSearchChange={() => {}}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    const scroller = screen.getByRole('listbox').parentElement;
    if (scroller) {
      fireEvent.scroll(scroller);
    }
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});
