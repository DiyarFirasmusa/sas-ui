import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterField, type FilterFieldLabels } from '@/components/ui/filter-bar-fields';
import type { FilterDefinition } from '@/lib/filter-state';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const labels: FilterFieldLabels = {
  any: 'Any',
  yes: 'Yes',
  no: 'No',
  min: 'Min',
  max: 'Max',
  from: 'From',
  to: 'To',
};

function setup(definition: FilterDefinition, value: unknown = undefined) {
  const onChange = vi.fn();
  render(<FilterField definition={definition} value={value} onChange={onChange} labels={labels} />);
  return onChange;
}

describe('FilterField', () => {
  it('text: edits through a labelled input', async () => {
    const onChange = setup({
      key: 'name',
      type: 'text',
      label: 'Name',
      placeholder: 'Who?',
    });
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    expect(onChange).toHaveBeenCalledWith('A');
    expect(screen.getByPlaceholderText('Who?')).toBeInTheDocument();
  });

  it('select: lists an "any" choice plus the options and reports the pick', async () => {
    const onChange = setup(
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [{ value: 'open', label: 'Open' }],
      },
      'open',
    );
    const trigger = screen.getByRole('combobox', { name: 'Status' });
    expect(trigger).toHaveTextContent('Open');
    await userEvent.click(trigger);
    expect(await screen.findByRole('option', { name: 'Any' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Any' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('boolean: maps yes/no/any to true/false/undefined', async () => {
    const onChange = setup({ key: 'paid', type: 'boolean', label: 'Paid' }, false);
    const trigger = screen.getByRole('combobox', { name: 'Paid' });
    expect(trigger).toHaveTextContent('No');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Yes' }));
    expect(onChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Any' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('multi-select: a checkbox list that adds and removes options', async () => {
    const onChange = setup(
      {
        key: 'tags',
        type: 'multi-select',
        label: 'Tags',
        options: [
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ],
      },
      ['a'],
    );
    const group = screen.getByRole('group', { name: 'Tags' });
    expect(within(group).getByRole('checkbox', { name: 'Alpha' })).toBeChecked();
    expect(within(group).getByRole('checkbox', { name: 'Beta' })).not.toBeChecked();
    await userEvent.click(within(group).getByRole('checkbox', { name: 'Beta' }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    await userEvent.click(within(group).getByRole('checkbox', { name: 'Alpha' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('date: a native date input that is always left-to-right', async () => {
    const onChange = setup({ key: 'due', type: 'date', label: 'Due' }, '2024-05-01');
    const input = screen.getByLabelText('Due');
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveAttribute('dir', 'ltr');
    expect(input).toHaveValue('2024-05-01');
    await userEvent.clear(input);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('number-range: two inputs in a labelled group, with the limits', async () => {
    const onChange = setup(
      { key: 'price', type: 'number-range', label: 'Price', min: 0, max: 100 },
      { min: 5 },
    );
    const group = screen.getByRole('group', { name: 'Price' });
    const min = within(group).getByLabelText('Min');
    expect(min).toHaveValue(5);
    expect(min).toHaveAttribute('max', '100');
    await userEvent.type(within(group).getByLabelText('Max'), '9');
    expect(onChange).toHaveBeenLastCalledWith({ min: 5, max: '9' });
  });

  it('date-range: from and to inputs', async () => {
    const onChange = setup(
      { key: 'created', type: 'date-range', label: 'Created' },
      { from: '2024-01-01' },
    );
    const group = screen.getByRole('group', { name: 'Created' });
    expect(within(group).getByLabelText('From')).toHaveValue('2024-01-01');
    await userEvent.type(within(group).getByLabelText('To'), '2024-02-01');
    expect(onChange).toHaveBeenLastCalledWith({
      from: '2024-01-01',
      to: '2024-02-01',
    });
  });

  it('ignores values of the wrong shape', () => {
    setup({ key: 'name', type: 'text', label: 'Name' }, 42);
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('renders inside an Arabic page', () => {
    renderWithLocale(
      <FilterField
        definition={{ key: 'due', type: 'date', label: 'تاريخ الاستحقاق' }}
        value=""
        onChange={() => {}}
        labels={labels}
      />,
      { locale: 'ar' },
    );
    expect(screen.getByLabelText('تاريخ الاستحقاق')).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations for any type', async () => {
    const definitions: FilterDefinition[] = [
      { key: 'name', type: 'text', label: 'Name' },
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [{ value: 'open', label: 'Open' }],
      },
      {
        key: 'tags',
        type: 'multi-select',
        label: 'Tags',
        options: [{ value: 'a', label: 'Alpha' }],
      },
      { key: 'paid', type: 'boolean', label: 'Paid' },
      { key: 'price', type: 'number-range', label: 'Price' },
      { key: 'due', type: 'date', label: 'Due' },
      { key: 'created', type: 'date-range', label: 'Created' },
    ];
    const { container } = render(
      <div>
        {definitions.map((definition) => (
          <FilterField
            key={definition.key}
            definition={definition}
            value={undefined}
            onChange={() => {}}
            labels={labels}
          />
        ))}
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
