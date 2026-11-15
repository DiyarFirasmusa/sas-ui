import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Tree } from '@/components/ui/tree';
import { collapseChecked, type TreeNode } from '@/lib/tree-utils';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const nodes: TreeNode[] = [
  {
    id: 'hq',
    label: 'Headquarters',
    children: [
      {
        id: 'fin',
        label: 'Finance',
        children: [
          { id: 'ap', label: 'Payables' },
          { id: 'ar', label: 'Receivables' },
        ],
      },
      { id: 'hr', label: 'Human resources', disabled: true },
    ],
  },
  { id: 'branch', label: 'Branch' },
];

function item(name: string) {
  return screen.getByRole('treeitem', { name });
}

describe('Tree structure', () => {
  it('renders a labelled tree with levels, sets and expansion state', () => {
    render(<Tree nodes={nodes} aria-label="Organisation" defaultExpanded={['hq']} />);
    expect(screen.getByRole('tree', { name: 'Organisation' })).toBeInTheDocument();
    const hq = item('Headquarters');
    expect(hq).toHaveAttribute('aria-level', '1');
    expect(hq).toHaveAttribute('aria-expanded', 'true');
    expect(hq).toHaveAttribute('aria-setsize', '2');
    expect(hq).toHaveAttribute('aria-posinset', '1');
    expect(item('Finance')).toHaveAttribute('aria-level', '2');
    expect(item('Finance')).toHaveAttribute('aria-expanded', 'false');
    expect(item('Branch')).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByRole('treeitem', { name: 'Payables' })).not.toBeInTheDocument();
  });

  it('indents with logical padding by depth', () => {
    render(<Tree nodes={nodes} aria-label="Org" defaultExpanded={['hq', 'fin']} />);
    const deep = item('Payables').style.paddingInlineStart;
    expect(deep).not.toBe('');
    expect(deep).not.toBe(item('Headquarters').style.paddingInlineStart);
    expect(item('Payables').style.paddingLeft).toBe('');
  });

  it('has only one tab stop', () => {
    render(<Tree nodes={nodes} aria-label="Org" defaultExpanded={['hq']} />);
    const stops = screen.getAllByRole('treeitem').filter((element) => element.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(item('Headquarters'));
  });
});

describe('Tree expansion', () => {
  it('opens and closes branches from the chevron and reports it', async () => {
    const onExpandedChange = vi.fn();
    render(<Tree nodes={nodes} aria-label="Org" selectionMode="none" onExpandedChange={onExpandedChange} />);
    const chevron = item('Headquarters').querySelector('[data-slot="tree-toggle"]');
    expect(chevron).not.toBeNull();
    await userEvent.click(chevron as Element);
    expect(onExpandedChange).toHaveBeenLastCalledWith(['hq']);
    expect(item('Finance')).toBeInTheDocument();
    await userEvent.click(chevron as Element);
    expect(screen.queryByRole('treeitem', { name: 'Finance' })).not.toBeInTheDocument();
  });

  it('opens a branch on row click when selection is off', async () => {
    render(<Tree nodes={nodes} aria-label="Org" selectionMode="none" />);
    await userEvent.click(item('Headquarters'));
    expect(item('Finance')).toBeInTheDocument();
  });

  it('can be controlled', async () => {
    function Controlled() {
      const [expanded, setExpanded] = useState<string[]>([]);
      return <Tree nodes={nodes} aria-label="Org" expanded={expanded} onExpandedChange={setExpanded} />;
    }
    render(<Controlled />);
    await userEvent.click(item('Headquarters').querySelector('[data-slot="tree-toggle"]') as Element);
    expect(item('Headquarters')).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Tree keyboard', () => {
  it('moves with arrows, Home and End', async () => {
    render(<Tree nodes={nodes} aria-label="Org" defaultExpanded={['hq']} />);
    item('Headquarters').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(item('Finance')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(item('Human resources')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(item('Branch')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(item('Human resources')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(item('Headquarters')).toHaveFocus();
  });

  it('keeps focus on the first and last rows at the edges', async () => {
    render(<Tree nodes={nodes} aria-label="Org" />);
    item('Headquarters').focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(item('Headquarters')).toHaveFocus();
    await userEvent.keyboard('{End}{ArrowDown}');
    expect(item('Branch')).toHaveFocus();
  });

  it('opens with ArrowRight, steps into the children, then closes with ArrowLeft', async () => {
    render(<Tree nodes={nodes} aria-label="Org" />);
    item('Headquarters').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(item('Headquarters')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(item('Finance')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('Headquarters')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('Headquarters')).toHaveAttribute('aria-expanded', 'false');
  });

  it('does nothing on ArrowRight for a leaf', async () => {
    render(<Tree nodes={nodes} aria-label="Org" />);
    item('Branch').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(item('Branch')).toHaveFocus();
  });

  it('mirrors the open and close keys in RTL', async () => {
    renderWithLocale(<Tree nodes={nodes} aria-label="Org" />, { locale: 'ar' });
    item('Headquarters').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(item('Headquarters')).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('Headquarters')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('Finance')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(item('Headquarters')).toHaveFocus();
  });

  it('activates with Enter and Space', async () => {
    const onSelectedChange = vi.fn();
    render(<Tree nodes={nodes} aria-label="Org" onSelectedChange={onSelectedChange} />);
    item('Headquarters').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelectedChange).toHaveBeenLastCalledWith(['hq']);
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');
    expect(onSelectedChange).toHaveBeenLastCalledWith(['branch']);
  });

  it('follows the focused row as the tab stop', async () => {
    render(<Tree nodes={nodes} aria-label="Org" />);
    item('Headquarters').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(item('Branch')).toHaveAttribute('tabindex', '0');
    expect(item('Headquarters')).toHaveAttribute('tabindex', '-1');
  });
});

describe('Tree selection', () => {
  it('selects one row at a time in single mode', async () => {
    const onSelectedChange = vi.fn();
    render(<Tree nodes={nodes} aria-label="Org" onSelectedChange={onSelectedChange} />);
    await userEvent.click(item('Headquarters'));
    await userEvent.click(item('Branch'));
    expect(onSelectedChange).toHaveBeenLastCalledWith(['branch']);
    expect(item('Branch')).toHaveAttribute('aria-selected', 'true');
    expect(item('Headquarters')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tree')).not.toHaveAttribute('aria-multiselectable');
  });

  it('toggles rows in multiple mode', async () => {
    render(<Tree nodes={nodes} aria-label="Org" selectionMode="multiple" />);
    await userEvent.click(item('Headquarters'));
    await userEvent.click(item('Branch'));
    expect(item('Headquarters')).toHaveAttribute('aria-selected', 'true');
    expect(item('Branch')).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(item('Branch'));
    expect(item('Branch')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('ignores disabled rows', async () => {
    const onSelectedChange = vi.fn();
    render(<Tree nodes={nodes} aria-label="Org" defaultExpanded={['hq']} onSelectedChange={onSelectedChange} />);
    expect(item('Human resources')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(item('Human resources'));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('shows a controlled selection', () => {
    render(<Tree nodes={nodes} aria-label="Org" selected={['branch']} />);
    expect(item('Branch')).toHaveAttribute('aria-selected', 'true');
  });

  it('does not select when clicking the chevron', async () => {
    const onSelectedChange = vi.fn();
    render(<Tree nodes={nodes} aria-label="Org" onSelectedChange={onSelectedChange} />);
    await userEvent.click(item('Headquarters').querySelector('[data-slot="tree-toggle"]') as Element);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});

describe('Tree checkboxes', () => {
  it('shows tri-state parents through aria-checked', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Tree nodes={nodes} aria-label="Org" checkable defaultExpanded={['hq', 'fin']} onCheckedChange={onCheckedChange} />,
    );
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(item('Payables'));
    expect(item('Payables')).toHaveAttribute('aria-checked', 'true');
    expect(item('Finance')).toHaveAttribute('aria-checked', 'mixed');
    expect(item('Headquarters')).toHaveAttribute('aria-checked', 'mixed');
    expect(item('Branch')).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item('Receivables'));
    expect(item('Finance')).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenLastCalledWith(expect.arrayContaining(['ap', 'ar', 'fin']));
  });

  it('checks every descendant from a branch and clears them again', async () => {
    render(<Tree nodes={nodes} aria-label="Org" checkable defaultExpanded={['hq', 'fin']} />);
    await userEvent.click(item('Finance'));
    expect(item('Payables')).toHaveAttribute('aria-checked', 'true');
    expect(item('Receivables')).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(item('Finance'));
    expect(item('Payables')).toHaveAttribute('aria-checked', 'false');
  });

  it('checks with Space and keeps disabled children untouched', async () => {
    const onCheckedChange = vi.fn();
    render(<Tree nodes={nodes} aria-label="Org" checkable defaultExpanded={['hq']} onCheckedChange={onCheckedChange} />);
    item('Headquarters').focus();
    await userEvent.keyboard(' ');
    const ids: string[] = onCheckedChange.mock.lastCall?.[0] ?? [];
    expect(ids).toEqual(expect.arrayContaining(['ap', 'ar', 'fin']));
    expect(ids).not.toContain('hr');
    expect(item('Headquarters')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('reflects a controlled value and works with collapseChecked', () => {
    render(<Tree nodes={nodes} aria-label="Org" checkable checked={['fin']} defaultExpanded={['hq', 'fin']} />);
    expect(item('Payables')).toHaveAttribute('aria-checked', 'true');
    expect(collapseChecked(nodes, ['ap', 'ar'])).toEqual(['fin']);
  });
});

describe('Tree lazy loading', () => {
  const lazyNodes: TreeNode[] = [{ id: 'root', label: 'Root', hasChildren: true }];

  it('loads children when a branch opens and shows them', async () => {
    const loadChildren = vi.fn().mockResolvedValue([{ id: 'kid', label: 'Kid' }]);
    render(<Tree nodes={lazyNodes} aria-label="Org" loadChildren={loadChildren} />);
    item('Root').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByRole('treeitem', { name: 'Kid' })).toBeInTheDocument();
    expect(loadChildren).toHaveBeenCalledOnce();
    expect(loadChildren).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }));
    await userEvent.keyboard('{ArrowLeft}{ArrowRight}');
    expect(loadChildren).toHaveBeenCalledOnce();
  });

  it('shows a loading row while waiting', async () => {
    let resolve: (value: TreeNode[]) => void = () => {};
    const loadChildren = vi.fn(
      () =>
        new Promise<TreeNode[]>((done) => {
          resolve = done;
        }),
    );
    render(<Tree nodes={lazyNodes} aria-label="Org" loadChildren={loadChildren} defaultExpanded={['root']} />);
    expect(await screen.findByRole('treeitem', { name: 'Loading…' })).toHaveAttribute('aria-busy', 'true');
    resolve([{ id: 'kid', label: 'Kid' }]);
    expect(await screen.findByRole('treeitem', { name: 'Kid' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'Loading…' })).not.toBeInTheDocument();
  });

  it('shows an error row that retries on Enter', async () => {
    const loadChildren = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: 'kid', label: 'Kid' }]);
    render(<Tree nodes={lazyNodes} aria-label="Org" loadChildren={loadChildren} defaultExpanded={['root']} />);
    const errorRow = await screen.findByRole('treeitem', { name: /Could not load/ });
    errorRow.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('treeitem', { name: 'Kid' })).toBeInTheDocument();
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });

  it('turns a branch with no children into a leaf', async () => {
    const loadChildren = vi.fn().mockResolvedValue([]);
    render(<Tree nodes={lazyNodes} aria-label="Org" loadChildren={loadChildren} defaultExpanded={['root']} />);
    await waitFor(() => expect(item('Root')).not.toHaveAttribute('aria-expanded'));
  });

  it('keeps the loaded children checked when the parent is checked first', async () => {
    const loadChildren = vi.fn().mockResolvedValue([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]);
    render(<Tree nodes={lazyNodes} aria-label="Org" checkable defaultChecked={['root']} loadChildren={loadChildren} defaultExpanded={['root']} />);
    expect(await screen.findByRole('treeitem', { name: 'A' })).toHaveAttribute('aria-checked', 'true');
    expect(item('Root')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Tree states', () => {
  it('shows a busy skeleton while loading', () => {
    render(<Tree nodes={[]} aria-label="Org" loading />);
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
  });

  it('shows an error with a retry button', async () => {
    const onRetry = vi.fn();
    render(<Tree nodes={[]} aria-label="Org" error onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the items.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows an empty message', () => {
    render(<Tree nodes={[]} aria-label="Org" />);
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
  });

  it('localises states to Arabic', () => {
    renderWithLocale(<Tree nodes={[]} aria-label="الهيكل" />, { locale: 'ar' });
    expect(screen.getByText('لا يوجد ما يمكن عرضه')).toBeInTheDocument();
  });

  it('renders custom row content', () => {
    render(
      <Tree
        nodes={nodes}
        aria-label="Org"
        renderNode={(node, state) => `${node.label} (level ${state.depth + 1})`}
      />,
    );
    expect(item('Branch (level 1)')).toBeInTheDocument();
  });
});

describe('Tree accessibility', () => {
  it('has no axe violations (single selection)', async () => {
    const { container } = render(<Tree nodes={nodes} aria-label="Org" defaultExpanded={['hq', 'fin']} defaultSelected={['ap']} />);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations (checkable, Arabic)', async () => {
    const { container } = renderWithLocale(
      <Tree nodes={nodes} aria-label="Org" checkable defaultExpanded={['hq', 'fin']} defaultChecked={['ap']} />,
      { locale: 'ar' },
    );
    await expectNoA11yViolations(container);
  });

  it('has no axe violations in the loading and error states', async () => {
    const { container, rerender } = render(<Tree nodes={[]} aria-label="Org" loading />);
    await expectNoA11yViolations(container);
    rerender(<Tree nodes={[]} aria-label="Org" error onRetry={() => {}} />);
    await expectNoA11yViolations(container);
  });
});
