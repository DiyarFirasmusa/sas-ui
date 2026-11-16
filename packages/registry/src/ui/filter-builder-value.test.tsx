import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FilterBuilder, type FilterBuilderProps } from '@/components/ui/filter-builder';
import {
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

async function choose(trigger: HTMLElement, option: string) {
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('option', { name: option }));
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

describe('RuleValue editors', () => {
  it('types a text value', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'name', 'contains', '')])}
      />,
    );
    await userEvent.type(ruleGroup(1).getByRole('textbox', { name: 'Value' }), 'ali');
    expect(ruleAt(latest(onChange), 0).value).toBe('ali');
  });
  it('hides the value editor for operators that need no value', async () => {
    render(<Harness initial={createGroup('and', [rule('a', 'name', 'contains', 'x')])} />);
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Condition' }), 'is empty');
    expect(ruleGroup(1).queryByRole('textbox', { name: 'Value' })).not.toBeInTheDocument();
  });
  it('has no value editor for a boolean rule', () => {
    render(<Harness initial={createGroup('and', [rule('a', 'active', 'is_true', null)])} />);
    expect(ruleGroup(1).queryByRole('textbox')).not.toBeInTheDocument();
    expect(ruleGroup(1).getAllByRole('combobox')).toHaveLength(2);
  });
  it('edits a number', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'amount', 'gt', null)])}
      />,
    );
    const input = ruleGroup(1).getByRole('textbox', { name: 'Value' });
    await userEvent.type(input, '1250');
    await userEvent.tab();
    expect(ruleAt(latest(onChange), 0).value).toBe(1250);
  });
  it('edits a number range with From and To', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'amount', 'between', { from: null, to: null })])}
      />,
    );
    await userEvent.type(ruleGroup(1).getByRole('textbox', { name: 'From' }), '10');
    await userEvent.tab();
    await userEvent.type(ruleGroup(1).getByRole('textbox', { name: 'To' }), '20');
    await userEvent.tab();
    expect(ruleAt(latest(onChange), 0).value).toEqual({ from: 10, to: 20 });
  });
  it('edits a date with the native date input', () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'created', 'on', null)])}
      />,
    );
    const input = ruleGroup(1).getByLabelText('Value');
    expect(input).toHaveAttribute('type', 'date');
    fireEvent.change(input, { target: { value: '2024-03-05' } });
    expect(ruleAt(latest(onChange), 0).value).toBe('2024-03-05');
    fireEvent.change(input, { target: { value: '' } });
    expect(ruleAt(latest(onChange), 0).value).toBeNull();
  });
  it('edits a date range', () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'created', 'between', { from: null, to: null })])}
      />,
    );
    fireEvent.change(ruleGroup(1).getByLabelText('From'), { target: { value: '2024-01-01' } });
    fireEvent.change(ruleGroup(1).getByLabelText('To'), { target: { value: '2024-01-31' } });
    expect(ruleAt(latest(onChange), 0).value).toEqual({ from: '2024-01-01', to: '2024-01-31' });
  });
  it('edits "in the last N days" with a days suffix', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'created', 'in_last', null)])}
      />,
    );
    expect(ruleGroup(1).getByText('days')).toBeInTheDocument();
    await userEvent.type(ruleGroup(1).getByRole('textbox', { name: 'Value' }), '30');
    await userEvent.tab();
    expect(ruleAt(latest(onChange), 0).value).toBe(30);
  });
  it('chooses a select option', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'status', 'is', null)])}
      />,
    );
    expect(ruleGroup(1).getByRole('combobox', { name: 'Value' })).toHaveTextContent('Choose…');
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Value' }), 'Open');
    expect(ruleAt(latest(onChange), 0).value).toBe('open');
  });
  it('chooses several options for "is any of"', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'status', 'is_any_of', [])])}
      />,
    );
    await userEvent.click(ruleGroup(1).getByRole('combobox', { name: 'Value' }));
    await userEvent.click(await screen.findByRole('option', { name: 'New' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Done' }));
    expect(ruleAt(latest(onChange), 0).value).toEqual(['new', 'done']);
  });
});

describe('RuleValue in Arabic and accessibility', () => {
  const arabic: FilterField[] = [
    { id: 'name', label: 'الاسم', type: 'text' },
    { id: 'amount', label: 'المبلغ', type: 'number' },
    { id: 'created', label: 'التاريخ', type: 'date' },
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

  it('labels every editor in Arabic and keeps numbers and dates left to right', () => {
    renderWithLocale(
      <Harness
        fields={arabic}
        initial={createGroup('and', [
          rule('a', 'amount', 'between', { from: 1, to: 20 }),
          rule('b', 'created', 'between', { from: '2024-01-01', to: '2024-01-31' }),
          rule('c', 'created', 'in_last', 7),
          rule('d', 'status', 'is_any_of', ['new']),
        ])}
      />,
      { locale: 'ar' },
    );
    expect(ruleGroup(1).getByRole('textbox', { name: 'من' })).toHaveAttribute('dir', 'ltr');
    expect(ruleGroup(1).getByRole('textbox', { name: 'إلى' })).toHaveValue('20');
    expect(ruleGroup(2).getByLabelText('من')).toHaveAttribute('dir', 'ltr');
    expect(ruleGroup(2).getByLabelText('إلى')).toHaveValue('2024-01-31');
    expect(ruleGroup(3).getByText('يوماً')).toBeInTheDocument();
    expect(ruleGroup(4).getByRole('button', { name: 'إزالة جديد' })).toBeInTheDocument();
  });

  it('edits Arabic text and picks an Arabic option', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    renderWithLocale(
      <Harness
        fields={arabic}
        onChange={onChange}
        initial={createGroup('and', [
          rule('a', 'name', 'contains', ''),
          rule('b', 'status', 'is', null),
        ])}
      />,
      { locale: 'ar' },
    );
    await userEvent.type(ruleGroup(1).getByRole('textbox', { name: 'القيمة' }), 'أحمد');
    expect(ruleAt(latest(onChange), 0).value).toBe('أحمد');
    await userEvent.click(ruleGroup(2).getByRole('combobox', { name: 'القيمة' }));
    await userEvent.click(await screen.findByRole('option', { name: 'منجز' }));
    expect(ruleAt(latest(onChange), 1).value).toBe('done');
  });

  it('has no axe violations for any editor, in English and Arabic', async () => {
    const tree = createGroup('and', [
      rule('a', 'name', 'contains', 'x'),
      rule('b', 'amount', 'between', { from: 1, to: 2 }),
      rule('c', 'created', 'between', { from: '2024-01-01', to: '2024-01-02' }),
      rule('d', 'created', 'in_last', 7),
      rule('e', 'status', 'is', 'new'),
      rule('f', 'status', 'is_any_of', ['new']),
    ]);
    const { unmount } = render(<Harness fields={arabic} initial={tree} />);
    await expectNoA11yViolations();
    unmount();
    renderWithLocale(<Harness fields={arabic} initial={tree} />, { locale: 'ar' });
    await expectNoA11yViolations();
  });
});
