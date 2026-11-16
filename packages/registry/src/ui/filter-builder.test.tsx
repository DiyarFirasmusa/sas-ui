import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilterBuilder, type FilterBuilderProps } from '@/components/ui/filter-builder';
import {
  countRules,
  createGroup,
  type FilterField,
  type FilterGroup,
  type FilterNode,
  type FilterRule,
} from '@/lib/filter-builder';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const fields: FilterField[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'amount', label: 'Amount', type: 'number' },
  { id: 'created', label: 'Created', type: 'date' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'new', label: 'New' },
      { value: 'open', label: 'Open' },
      { value: 'done', label: 'Done' },
    ],
  },
  { id: 'active', label: 'Active', type: 'boolean' },
];

const arabicFields: FilterField[] = [
  { id: 'name', label: 'الاسم', type: 'text' },
  { id: 'amount', label: 'المبلغ', type: 'number' },
  {
    id: 'status',
    label: 'الحالة',
    type: 'select',
    options: [
      { value: 'new', label: 'جديد' },
      { value: 'done', label: 'منجز' },
    ],
  },
];

function rule(
  id: string,
  field: string,
  operator: FilterRule['operator'],
  value: FilterRule['value'],
): FilterRule {
  return { id, field, operator, value };
}

function Harness({
  initial = createGroup(),
  onChange,
  ...props
}: {
  initial?: FilterGroup;
  onChange?: (value: FilterGroup) => void;
} & Partial<FilterBuilderProps>) {
  const [value, setValue] = useState<FilterGroup>(initial);
  return (
    <FilterBuilder
      fields={fields}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      {...props}
    />
  );
}

function ruleGroup(position: number) {
  return within(screen.getByRole('group', { name: new RegExp(`^(Rule|شرط) ${position}$`) }));
}

function at<T>(list: readonly T[], index: number): T {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`no item at ${index}`);
  }
  return item;
}

function latest<T>(mock: ReturnType<typeof vi.fn<(value: T) => void>>): T {
  const call = mock.mock.calls.at(-1);
  if (call === undefined) {
    throw new Error('not called');
  }
  return call[0];
}

function ruleAt(group: FilterGroup, index: number): FilterRule {
  const node: FilterNode | undefined = group.rules[index];
  if (node === undefined || 'combinator' in node) {
    throw new Error(`no rule at ${index}`);
  }
  return node;
}

describe('FilterBuilder structure', () => {
  it('shows an empty state and an add button for an empty filter', () => {
    render(<Harness />);
    expect(screen.getByRole('group', { name: 'Advanced filters' })).toBeInTheDocument();
    expect(screen.getByText(/No conditions yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add rule' })).toBeEnabled();
  });

  it('cannot add rules without fields', () => {
    render(<FilterBuilder fields={[]} value={createGroup()} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add rule' })).toBeDisabled();
  });

  it('adds a rule on the first field with its first operator', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));
    const added = ruleAt(latest(onChange), 0);
    expect(added).toMatchObject({ field: 'name', operator: 'contains', value: '' });
    expect(ruleGroup(1).getByRole('combobox', { name: 'Field' })).toHaveTextContent('Name');
    expect(ruleGroup(1).getByRole('combobox', { name: 'Condition' })).toHaveTextContent('contains');
    expect(screen.queryByText(/No conditions yet/)).not.toBeInTheDocument();
  });

  it('removes a rule', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [
          rule('a', 'name', 'contains', 'x'),
          rule('b', 'name', 'contains', 'y'),
        ])}
      />,
    );
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Rule 1' })).getByRole('button', {
        name: 'Remove rule',
      }),
    );
    const next = latest(onChange);
    expect(countRules(next)).toBe(1);
    expect(ruleAt(next, 0).id).toBe('b');
    expect(screen.getAllByRole('group', { name: /^Rule/ })).toHaveLength(1);
  });

  it('adds a nested group, adds a rule inside it and removes it', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add group' }));
    const groups = screen.getAllByRole('group', { name: 'Group' });
    expect(groups).toHaveLength(2);
    const nested = at(groups, 1);
    expect(nested).toHaveAttribute('data-depth', '2');
    await userEvent.click(within(nested).getByRole('button', { name: 'Add rule' }));
    expect(countRules(latest(onChange))).toBe(1);
    expect(within(nested).getByRole('group', { name: 'Rule 1' })).toBeInTheDocument();
    await userEvent.click(within(nested).getByRole('button', { name: 'Remove group' }));
    expect(latest(onChange).rules).toHaveLength(0);
    expect(screen.getAllByRole('group', { name: 'Group' })).toHaveLength(1);
  });

  it('does not offer to remove the root group', () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Remove group' })).not.toBeInTheDocument();
  });

  it('nests to the requested depth and no further', async () => {
    render(<Harness maxDepth={2} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add group' }));
    expect(screen.getAllByRole('button', { name: 'Add group' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Add rule' })).toHaveLength(2);
  });

  it('can nest three levels by default', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Add group' }));
    await userEvent.click(at(screen.getAllByRole('button', { name: 'Add group' }), 0));
    expect(screen.getAllByRole('group', { name: 'Group' })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Add group' })).toHaveLength(2);
  });

  it('offers no groups at maxDepth 1', () => {
    render(<Harness maxDepth={1} />);
    expect(screen.queryByRole('button', { name: 'Add group' })).not.toBeInTheDocument();
  });

  it('renders a tree that arrives pre-filled', () => {
    render(
      <Harness
        initial={createGroup('or', [
          rule('a', 'name', 'starts_with', 'ali'),
          createGroup('and', [rule('b', 'amount', 'gt', 5), rule('c', 'active', 'is_true', null)]),
        ])}
      />,
    );
    expect(screen.getAllByRole('group', { name: /^Rule/ })).toHaveLength(3);
    const values = screen.getAllByRole('textbox', { name: 'Value' });
    expect(values.map((input) => input.getAttribute('value'))).toEqual(['ali', '5']);
  });
});

describe('FilterBuilder combinator', () => {
  it('shows And pressed and switches to Or', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(<Harness onChange={onChange} />);
    const and = screen.getByRole('button', { name: 'And' });
    const or = screen.getByRole('button', { name: 'Or' });
    expect(and).toHaveAttribute('aria-pressed', 'true');
    expect(or).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(or);
    expect(latest(onChange).combinator).toBe('or');
    expect(or).toHaveAttribute('aria-pressed', 'true');
  });

  it('cannot be unset by pressing the active option again', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'And' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'And' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets the combinator of a nested group on its own', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(<Harness onChange={onChange} initial={createGroup('and', [createGroup('and', [])])} />);
    const nested = at(screen.getAllByRole('group', { name: 'Group' }), 1);
    await userEvent.click(within(nested).getByRole('button', { name: 'Or' }));
    const next = latest(onChange);
    expect(next.combinator).toBe('and');
    expect(next.rules[0] && 'combinator' in next.rules[0] && next.rules[0].combinator).toBe('or');
  });

  it('moves between options with the arrow keys', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(<Harness onChange={onChange} />);
    screen.getByRole('button', { name: 'And' }).focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(latest(onChange).combinator).toBe('or');
  });
});

describe('FilterBuilder apply and reset', () => {
  it('only shows the buttons that have handlers', () => {
    const { rerender } = render(
      <FilterBuilder fields={fields} value={createGroup()} onChange={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
    rerender(
      <FilterBuilder
        fields={fields}
        value={createGroup()}
        onChange={() => {}}
        onApply={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('applies a complete filter', async () => {
    const onApply = vi.fn();
    const initial = createGroup('and', [rule('a', 'name', 'contains', 'ali')]);
    render(<Harness initial={initial} onApply={onApply} />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(initial);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies an empty filter', async () => {
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(createGroup());
  });

  it('shows what is wrong and does not apply an incomplete filter', async () => {
    const onApply = vi.fn();
    render(
      <Harness
        onApply={onApply}
        initial={createGroup('and', [
          rule('a', 'name', 'contains', ''),
          rule('b', 'amount', 'between', { from: 9, to: 1 }),
          rule('c', 'name', 'contains', 'fine'),
        ])}
      />,
    );
    expect(screen.queryByText('Enter a value')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(ruleGroup(1).getByText('Enter a value')).toBeInTheDocument();
    expect(ruleGroup(2).getByText('The start must not be after the end')).toBeInTheDocument();
    expect(
      ruleGroup(3).queryByText(/./, { selector: '[data-slot="filter-builder-error"]' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Rules needing attention: 2');
    expect(ruleGroup(1).getByRole('textbox', { name: 'Value' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('describes an invalid rule through aria-describedby', async () => {
    render(
      <Harness
        onApply={() => {}}
        initial={createGroup('and', [rule('a', 'name', 'contains', '')])}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const group = screen.getByRole('group', { name: 'Rule 1' });
    expect(group).toHaveAccessibleDescription('Enter a value');
    expect(within(group).getByRole('textbox', { name: 'Value' })).toHaveAccessibleDescription(
      'Enter a value',
    );
  });

  it('clears the errors as the rule is fixed and then applies', async () => {
    const onApply = vi.fn();
    render(
      <Harness
        onApply={onApply}
        initial={createGroup('and', [rule('a', 'name', 'contains', '')])}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.type(ruleGroup(1).getByRole('textbox', { name: 'Value' }), 'ok');
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.queryByText('Enter a value')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('flags a rule whose field is gone', async () => {
    render(
      <Harness
        onApply={() => {}}
        initial={createGroup('and', [rule('a', 'ghost', 'contains', 'x')])}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('This field is no longer available')).toBeInTheDocument();
    expect(ruleGroup(1).queryByRole('combobox', { name: 'Condition' })).not.toBeInTheDocument();
  });

  it('empties the filter and calls onReset', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    const onReset = vi.fn();
    render(
      <Harness
        onChange={onChange}
        onReset={onReset}
        initial={createGroup('or', [rule('a', 'name', 'contains', 'x')])}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(latest(onChange)).toEqual(createGroup());
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/No conditions yet/)).toBeInTheDocument();
  });
});

describe('FilterBuilder labels', () => {
  it('overrides labels and the accessible name', () => {
    render(
      <Harness
        aria-label="Invoice filters"
        labels={{ addRule: 'New condition', and: 'All', or: 'Any' }}
      />,
    );
    expect(screen.getByRole('group', { name: 'Invoice filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New condition' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Any' })).toBeInTheDocument();
  });
});

describe('FilterBuilder layout classes', () => {
  it('stacks a rule on phones and lays it out in a row from sm', () => {
    render(<Harness initial={createGroup('and', [rule('a', 'name', 'contains', 'x')])} />);
    const row = ruleGroup(1).getByRole('textbox', { name: 'Value' }).closest('.sm\\:flex-row');
    expect(row).not.toBeNull();
    expect(row?.className).toMatch(/\bflex-col\b/);
  });
});

describe('FilterBuilder accessibility', () => {
  const full = createGroup('and', [
    rule('a', 'name', 'contains', 'ali'),
    rule('b', 'amount', 'between', { from: 1, to: 5 }),
    rule('c', 'created', 'in_last', 7),
    rule('d', 'status', 'is_any_of', ['new']),
    rule('e', 'active', 'is_true', null),
    createGroup('or', [rule('f', 'name', 'is_empty', null)]),
  ]);

  it('has no axe violations', async () => {
    render(<Harness initial={full} onApply={() => {}} onReset={() => {}} />);
    await expectNoA11yViolations();
  });

  it('has no axe violations with errors showing', async () => {
    render(
      <Harness
        onApply={() => {}}
        initial={createGroup('and', [
          rule('a', 'name', 'contains', ''),
          rule('b', 'created', 'on', null),
        ])}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getAllByText('Enter a value').length).toBeGreaterThan(0);
    await expectNoA11yViolations();
  });

  it('has no axe violations in Arabic / RTL', async () => {
    renderWithLocale(
      <Harness
        fields={arabicFields}
        onApply={() => {}}
        onReset={() => {}}
        initial={createGroup('and', [
          rule('a', 'name', 'contains', 'أحمد'),
          rule('b', 'amount', 'between', { from: 1, to: 5 }),
          rule('c', 'status', 'is_any_of', ['new']),
          createGroup('or', [rule('d', 'name', 'contains', 'علي')]),
        ])}
      />,
      { locale: 'ar' },
    );
    await expectNoA11yViolations();
  });
});
