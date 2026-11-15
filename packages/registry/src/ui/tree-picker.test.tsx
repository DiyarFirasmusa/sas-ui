import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TreePicker } from '@/components/ui/tree-picker';
import type { TreeNode } from '@/lib/tree-utils';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const nodes: TreeNode[] = [
  {
    id: 'hq',
    label: 'Head office',
    children: [
      {
        id: 'fin',
        label: 'Finance',
        children: [
          { id: 'ap', label: 'Payables' },
          { id: 'ar', label: 'Receivables' },
        ],
      },
      { id: 'hr', label: 'Human resources' },
    ],
  },
  {
    id: 'north',
    label: 'North branch',
    children: [{ id: 'north-1', label: 'Sales' }],
  },
];

async function openPicker(name = 'Unit') {
  await userEvent.click(screen.getByRole('button', { name }));
  return screen.findByRole('tree');
}

describe('TreePicker single', () => {
  it('shows the placeholder, then the selected path', async () => {
    const onValueChange = vi.fn();
    render(
      <TreePicker
        aria-label="Unit"
        nodes={nodes}
        placeholder="Pick a unit"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Unit' });
    expect(trigger).toHaveTextContent('Pick a unit');
    const tree = await openPicker();
    await userEvent.click(
      within(tree)
        .getByRole('treeitem', { name: 'Head office' })
        .querySelector('[data-slot="tree-toggle"]') as Element,
    );
    await userEvent.click(
      within(tree)
        .getByRole('treeitem', { name: 'Finance' })
        .querySelector('[data-slot="tree-toggle"]') as Element,
    );
    await userEvent.click(within(tree).getByRole('treeitem', { name: 'Payables' }));
    expect(onValueChange).toHaveBeenCalledWith('ap');
    await waitFor(() => expect(screen.queryByRole('tree')).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent('Head office / Finance / Payables');
  });

  it('can select a branch at any level', async () => {
    const onValueChange = vi.fn();
    render(<TreePicker aria-label="Unit" nodes={nodes} onValueChange={onValueChange} />);
    const tree = await openPicker();
    await userEvent.click(within(tree).getByRole('treeitem', { name: 'North branch' }));
    expect(onValueChange).toHaveBeenCalledWith('north');
  });

  it('opens with the path to the current value expanded and selected', async () => {
    render(<TreePicker aria-label="Unit" nodes={nodes} defaultValue="ar" />);
    const tree = await openPicker();
    expect(within(tree).getByRole('treeitem', { name: 'Receivables' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('uses a custom path separator and falls back to valueLabel', () => {
    const { rerender } = render(
      <TreePicker aria-label="Unit" nodes={nodes} value="fin" pathSeparator=" › " />,
    );
    expect(screen.getByRole('button', { name: 'Unit' })).toHaveTextContent('Head office › Finance');
    rerender(
      <TreePicker aria-label="Unit" nodes={nodes} value="lazy-id" valueLabel="Remote unit" />,
    );
    expect(screen.getByRole('button', { name: 'Unit' })).toHaveTextContent('Remote unit');
  });

  it('filters by the search text, keeping ancestors and opening them', async () => {
    render(<TreePicker aria-label="Unit" nodes={nodes} />);
    await openPicker();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'payab');
    const tree = screen.getByRole('tree');
    expect(
      within(tree)
        .getAllByRole('treeitem')
        .map((item) => item.textContent),
    ).toEqual(['Head office', 'Finance', 'Payables']);
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search' }));
    expect(
      within(screen.getByRole('tree')).getByRole('treeitem', {
        name: 'North branch',
      }),
    ).toBeInTheDocument();
  });

  it('says so when the search has no hits', async () => {
    render(<TreePicker aria-label="Unit" nodes={nodes} />);
    await openPicker();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'zzz');
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('clears the value', async () => {
    const onValueChange = vi.fn();
    render(
      <TreePicker
        aria-label="Unit"
        nodes={nodes}
        defaultValue="fin"
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('button', { name: 'Unit' })).toHaveTextContent('Select…');
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('hides the clear button when not clearable or disabled', () => {
    const { rerender } = render(
      <TreePicker aria-label="Unit" nodes={nodes} defaultValue="fin" clearable={false} />,
    );
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
    rerender(<TreePicker aria-label="Unit" nodes={nodes} defaultValue="fin" disabled />);
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unit' })).toBeDisabled();
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    render(<TreePicker aria-label="Unit" nodes={nodes} />);
    await openPicker();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tree')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Unit' })).toHaveFocus();
  });

  it('works as a controlled input and submits through a hidden field', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('hr');
      return (
        <>
          <TreePicker
            aria-label="Unit"
            nodes={nodes}
            value={value}
            onValueChange={setValue}
            name="unit"
          />
          <button type="button" onClick={() => setValue('north')}>
            External
          </button>
        </>
      );
    }
    const { container } = render(<Controlled />);
    expect(container.querySelector('input[name="unit"]')).toHaveValue('hr');
    await userEvent.click(screen.getByRole('button', { name: 'External' }));
    expect(screen.getByRole('button', { name: 'Unit' })).toHaveTextContent('North branch');
    expect(container.querySelector('input[name="unit"]')).toHaveValue('north');
  });

  it('forwards ref, id and blur to the trigger', async () => {
    const onBlur = vi.fn();
    let element: HTMLButtonElement | null = null;
    render(
      <TreePicker
        aria-label="Unit"
        nodes={nodes}
        id="unit-field"
        onBlur={onBlur}
        ref={(node) => {
          element = node;
        }}
      />,
    );
    expect(element).toBe(screen.getByRole('button', { name: 'Unit' }));
    expect(screen.getByRole('button', { name: 'Unit' })).toHaveAttribute('id', 'unit-field');
    screen.getByRole('button', { name: 'Unit' }).focus();
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });
});

describe('TreePicker multiple', () => {
  it('checks branches and reports the shortest list', async () => {
    const onValueChange = vi.fn();
    render(<TreePicker multiple aria-label="Units" nodes={nodes} onValueChange={onValueChange} />);
    const tree = await openPicker('Units');
    await userEvent.click(within(tree).getByRole('treeitem', { name: 'Head office' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['hq']);
    expect(screen.getByRole('button', { name: 'Units' })).toHaveTextContent('Head office');
    await userEvent.click(within(tree).getByRole('treeitem', { name: 'North branch' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['hq', 'north']);
    expect(screen.getByRole('button', { name: 'Units' })).toHaveTextContent(
      'Head office, North branch',
    );
  });

  it('summarises many selections as a count', () => {
    render(
      <TreePicker multiple aria-label="Units" nodes={nodes} value={['ap', 'hr', 'north-1']} />,
    );
    expect(screen.getByRole('button', { name: 'Units' })).toHaveTextContent('3 selected');
  });

  it('shows tri-state parents', async () => {
    render(<TreePicker multiple aria-label="Units" nodes={nodes} defaultValue={['ap']} />);
    const tree = await openPicker('Units');
    expect(within(tree).getByRole('treeitem', { name: 'Head office' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
    expect(within(tree).getByRole('treeitem', { name: 'Payables' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('keeps parents honest while a search hides some children', async () => {
    const onValueChange = vi.fn();
    render(<TreePicker multiple aria-label="Units" nodes={nodes} onValueChange={onValueChange} />);
    await openPicker('Units');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'payab');
    await userEvent.click(screen.getByRole('treeitem', { name: 'Payables' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['ap']);
    expect(screen.getByRole('treeitem', { name: 'Finance' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('clears every selection', async () => {
    const onValueChange = vi.fn();
    render(
      <TreePicker
        multiple
        aria-label="Units"
        nodes={nodes}
        defaultValue={['hr']}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onValueChange).toHaveBeenCalledWith([]);
  });
});

describe('TreePicker states', () => {
  it('shows loading and error states inside the panel', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TreePicker aria-label="Unit" nodes={[]} loading />);
    await userEvent.click(screen.getByRole('button', { name: 'Unit' }));
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    rerender(<TreePicker aria-label="Unit" nodes={[]} error onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows an empty message for no nodes', async () => {
    render(<TreePicker aria-label="Unit" nodes={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Unit' }));
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('loads children lazily', async () => {
    const loadChildren = vi.fn().mockResolvedValue([{ id: 'kid', label: 'Kid unit' }]);
    render(
      <TreePicker
        aria-label="Unit"
        nodes={[{ id: 'root', label: 'Root', hasChildren: true }]}
        loadChildren={loadChildren}
      />,
    );
    const tree = await openPicker();
    const root = within(tree).getByRole('treeitem', { name: 'Root' });
    root.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByRole('treeitem', { name: 'Kid unit' })).toBeInTheDocument();
  });
});

describe('TreePicker locale and accessibility', () => {
  it('localises the controls and the path text to Arabic', async () => {
    const arabic: TreeNode[] = [
      {
        id: 'a',
        label: 'الإدارة العامة',
        children: [{ id: 'b', label: 'قسم المالية' }],
      },
    ];
    renderWithLocale(<TreePicker aria-label="الوحدة" nodes={arabic} defaultValue="b" />, {
      locale: 'ar',
    });
    expect(screen.getByRole('button', { name: 'الوحدة' })).toHaveTextContent(
      'الإدارة العامة / قسم المالية',
    );
    expect(screen.getByRole('button', { name: 'مسح الاختيار' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'الوحدة' }));
    expect(await screen.findByRole('searchbox', { name: 'بحث' })).toBeInTheDocument();
  });

  it('finds Arabic spelling variants in the search', async () => {
    const arabic: TreeNode[] = [
      { id: 'a', label: 'الإدارة العامة' },
      { id: 'b', label: 'المالية' },
    ];
    renderWithLocale(<TreePicker aria-label="الوحدة" nodes={arabic} />, {
      locale: 'ar',
    });
    await userEvent.click(screen.getByRole('button', { name: 'الوحدة' }));
    await userEvent.type(await screen.findByRole('searchbox', { name: 'بحث' }), 'الاداره');
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
  });

  it('has no axe violations closed, open and invalid', async () => {
    const { container } = render(
      <TreePicker aria-label="Unit" nodes={nodes} defaultValue="fin" invalid />,
    );
    await expectNoA11yViolations(container);
    await openPicker();
    await expectNoA11yViolations();
  });

  it('has no axe violations when multiple and open', async () => {
    render(<TreePicker multiple aria-label="Units" nodes={nodes} defaultValue={['ap']} />);
    await openPicker('Units');
    await expectNoA11yViolations();
  });
});
