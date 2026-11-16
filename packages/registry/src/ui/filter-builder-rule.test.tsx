import { render, screen, within } from '@testing-library/react';
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

describe('FilterBuilderRule operators', () => {
  it('lists the operators of a text field', async () => {
    render(<Harness initial={createGroup('and', [rule('a', 'name', 'contains', '')])} />);
    await userEvent.click(ruleGroup(1).getByRole('combobox', { name: 'Condition' }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'contains',
      'does not contain',
      'equals',
      'starts with',
      'is empty',
    ]);
  });
  it('lists the operators of a number, date, select and boolean field', async () => {
    const cases: [string, string[]][] = [
      [
        'amount',
        [
          'equals',
          'does not equal',
          'is greater than',
          'is at least',
          'is less than',
          'is at most',
          'is between',
        ],
      ],
      ['created', ['is on', 'is before', 'is after', 'is between', 'is within the last']],
      ['status', ['is', 'is not', 'is any of']],
      ['active', ['is true', 'is false']],
    ];
    // The operator of each starting rule is the first one of its type.
    const starts: Record<string, FilterRule['operator']> = {
      amount: 'eq',
      created: 'on',
      status: 'is',
      active: 'is_true',
    };
    for (const [field, expected] of cases) {
      const operator = starts[field];
      if (operator === undefined) {
        throw new Error('missing');
      }
      const { unmount } = render(
        <Harness initial={createGroup('and', [rule('a', field, operator, null)])} />,
      );
      await userEvent.click(ruleGroup(1).getByRole('combobox', { name: 'Condition' }));
      const options = await screen.findAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual(expected);
      unmount();
    }
  });
});

describe('FilterBuilder resetting incompatible values', () => {
  it('keeps the value between operators of the same kind', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness onChange={onChange} initial={createGroup('and', [rule('a', 'amount', 'gt', 5)])} />,
    );
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Condition' }), 'is at least');
    expect(ruleAt(latest(onChange), 0)).toMatchObject({ operator: 'gte', value: 5 });
    expect(ruleGroup(1).getByRole('textbox', { name: 'Value' })).toHaveValue('5');
  });

  it('clears the value when the operator needs another kind', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness onChange={onChange} initial={createGroup('and', [rule('a', 'amount', 'gt', 5)])} />,
    );
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Condition' }), 'is between');
    expect(ruleAt(latest(onChange), 0)).toMatchObject({
      operator: 'between',
      value: { from: null, to: null },
    });
    expect(ruleGroup(1).getByRole('textbox', { name: 'From' })).toHaveValue('');
  });

  it('turns one option into a list when switching to "is any of"', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'status', 'is', 'open')])}
      />,
    );
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Condition' }), 'is any of');
    expect(ruleAt(latest(onChange), 0).value).toEqual(['open']);
    expect(ruleGroup(1).getByRole('button', { name: 'Remove Open' })).toBeInTheDocument();
  });

  it('resets operator and value when the field type changes', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'name', 'starts_with', 'ali')])}
      />,
    );
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Field' }), 'Amount');
    expect(ruleAt(latest(onChange), 0)).toEqual({
      id: 'a',
      field: 'amount',
      operator: 'eq',
      value: null,
    });
    expect(ruleGroup(1).getByRole('combobox', { name: 'Condition' })).toHaveTextContent('equals');
    expect(ruleGroup(1).getByRole('textbox', { name: 'Value' })).toHaveValue('');
  });

  it('shows the operators of the new field after a type change', async () => {
    render(<Harness initial={createGroup('and', [rule('a', 'name', 'contains', '')])} />);
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Field' }), 'Active');
    expect(ruleGroup(1).getByRole('combobox', { name: 'Condition' })).toHaveTextContent('is true');
    expect(ruleGroup(1).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('keeps operator and value between two text fields', async () => {
    const twoText: FilterField[] = [
      { id: 'name', label: 'Name', type: 'text' },
      { id: 'title', label: 'Title', type: 'text' },
    ];
    const onChange = vi.fn<(value: FilterGroup) => void>();
    render(
      <Harness
        fields={twoText}
        onChange={onChange}
        initial={createGroup('and', [rule('a', 'name', 'starts_with', 'ali')])}
      />,
    );
    await choose(ruleGroup(1).getByRole('combobox', { name: 'Field' }), 'Title');
    expect(ruleAt(latest(onChange), 0)).toEqual(rule('a', 'title', 'starts_with', 'ali'));
  });
});

describe('FilterBuilder in Arabic', () => {
  const arabicTree = createGroup('and', [
    rule('a', 'name', 'contains', 'أحمد'),
    rule('b', 'amount', 'gt', 1500),
    rule('c', 'status', 'is', 'new'),
  ]);

  it('speaks Arabic', () => {
    renderWithLocale(<Harness fields={arabicFields} initial={arabicTree} />, { locale: 'ar' });
    expect(screen.getByRole('group', { name: 'تصفية متقدمة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إضافة شرط' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إضافة مجموعة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'و' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'أو' })).toBeInTheDocument();
    expect(ruleGroup(1).getByRole('combobox', { name: 'الحقل' })).toHaveTextContent('الاسم');
    expect(ruleGroup(1).getByRole('combobox', { name: 'الحالة' })).toHaveTextContent('يحتوي على');
    expect(ruleGroup(2).getByRole('combobox', { name: 'الحالة' })).toHaveTextContent('أكبر من');
  });

  it('keeps Arabic text as typed and numbers in Latin digits, left to right', () => {
    renderWithLocale(<Harness fields={arabicFields} initial={arabicTree} />, { locale: 'ar' });
    const text = ruleGroup(1).getByRole('textbox', { name: 'القيمة' });
    expect(text).toHaveValue('أحمد');
    expect(text).toHaveAttribute('dir', 'auto');
    const number = ruleGroup(2).getByRole('textbox', { name: 'القيمة' });
    expect(number).toHaveValue('1,500');
    expect(number).toHaveAttribute('dir', 'ltr');
  });

  it('adds rules, switches the combinator and edits Arabic text', async () => {
    const onChange = vi.fn<(value: FilterGroup) => void>();
    renderWithLocale(<Harness fields={arabicFields} onChange={onChange} />, { locale: 'ar' });
    await userEvent.click(screen.getByRole('button', { name: 'إضافة شرط' }));
    await userEvent.type(ruleGroup(1).getByRole('textbox', { name: 'القيمة' }), 'مُحَمَّد');
    expect(ruleAt(latest(onChange), 0).value).toBe('مُحَمَّد');
    await userEvent.click(screen.getByRole('button', { name: 'أو' }));
    expect(latest(onChange).combinator).toBe('or');
  });

  it('lists the Arabic operators for a number field and chooses one', async () => {
    renderWithLocale(
      <Harness
        fields={arabicFields}
        initial={createGroup('and', [rule('a', 'amount', 'eq', null)])}
      />,
      { locale: 'ar' },
    );
    await userEvent.click(ruleGroup(1).getByRole('combobox', { name: 'الحالة' }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'يساوي',
      'لا يساوي',
      'أكبر من',
      'أكبر من أو يساوي',
      'أصغر من',
      'أصغر من أو يساوي',
      'بين',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'بين' }));
    expect(ruleGroup(1).getByRole('textbox', { name: 'من' })).toBeInTheDocument();
    expect(ruleGroup(1).getByRole('textbox', { name: 'إلى' })).toBeInTheDocument();
  });

  it('shows Arabic validation messages after a failed apply', async () => {
    const onApply = vi.fn();
    renderWithLocale(
      <Harness
        fields={arabicFields}
        onApply={onApply}
        initial={createGroup('and', [rule('a', 'name', 'contains', '')])}
      />,
      { locale: 'ar' },
    );
    await userEvent.click(screen.getByRole('button', { name: 'تطبيق' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(ruleGroup(1).getByText('أدخل قيمة')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('عدد الشروط التي تحتاج إلى مراجعة: 1');
  });

  it('nests and removes groups in Arabic', async () => {
    renderWithLocale(<Harness fields={arabicFields} />, { locale: 'ar' });
    await userEvent.click(screen.getByRole('button', { name: 'إضافة مجموعة' }));
    expect(screen.getAllByRole('group', { name: 'مجموعة' })).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'حذف المجموعة' }));
    expect(screen.getAllByRole('group', { name: 'مجموعة' })).toHaveLength(1);
  });
});

describe('FilterBuilderRule accessibility', () => {
  it('has no axe violations for a rule row, valid or flagged', async () => {
    render(
      <Harness
        onApply={() => {}}
        initial={createGroup('and', [
          rule('a', 'name', 'contains', 'x'),
          rule('b', 'amount', 'gt', null),
        ])}
      />,
    );
    await expectNoA11yViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(ruleGroup(2).getByText('Enter a value')).toBeInTheDocument();
    await expectNoA11yViolations();
  });
});
