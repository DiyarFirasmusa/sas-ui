import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  TreeItemRow,
  TreeStatusRow,
  type TreeItemRowProps,
  type TreeStatusRowProps,
} from '@/components/ui/tree-row';
import type { FlatTreeNode } from '@/lib/tree-utils';
import { expectNoA11yViolations } from '@/test/a11y';

const branch: FlatTreeNode = {
  node: { id: 'hq', label: 'Headquarters', children: [{ id: 'fin', label: 'Finance' }] },
  depth: 1,
  parentId: null,
  position: 2,
  setSize: 3,
  isBranch: true,
  expanded: false,
};

function behaviour() {
  return {
    setRef: vi.fn(),
    tabIndex: -1,
    onFocus: vi.fn(),
    onKeyDown: vi.fn(),
    onActivate: vi.fn(),
  };
}

function renderItem(props: Partial<TreeItemRowProps<unknown>> = {}) {
  const handlers = behaviour();
  const onToggleExpanded = vi.fn();
  render(
    <div role="tree" aria-label="Org">
      <TreeItemRow
        flat={branch}
        checkable={false}
        selectionMode="single"
        checkState="unchecked"
        selected={false}
        onToggleExpanded={onToggleExpanded}
        {...handlers}
        {...props}
      />
    </div>,
  );
  return { handlers, onToggleExpanded, item: screen.getByRole('treeitem') };
}

function renderStatus(props: Partial<TreeStatusRowProps> = {}) {
  const handlers = behaviour();
  render(
    <div role="tree" aria-label="Org">
      <TreeStatusRow
        depth={1}
        state="loading"
        loadingLabel="Loading…"
        errorLabel="Could not load."
        {...handlers}
        {...props}
      />
    </div>,
  );
  return { handlers, item: screen.getByRole('treeitem') };
}

describe('TreeItemRow', () => {
  it('exposes level, position, set size and expansion', () => {
    const { item } = renderItem();
    expect(item).toHaveAttribute('aria-level', '2');
    expect(item).toHaveAttribute('aria-posinset', '2');
    expect(item).toHaveAttribute('aria-setsize', '3');
    expect(item).toHaveAttribute('aria-expanded', 'false');
    expect(item).toHaveAttribute('aria-selected', 'false');
    expect(item.style.paddingInlineStart).toBe('calc(1.75rem)');
  });

  it('marks the selected row, and drops aria-selected when selection is off', () => {
    const selected = renderItem({ selected: true });
    expect(selected.item).toHaveAttribute('aria-selected', 'true');
    expect(selected.item).toHaveClass('bg-primary-light');
  });

  it('has no aria-selected without a selection mode', () => {
    const { item } = renderItem({ selectionMode: 'none' });
    expect(item).not.toHaveAttribute('aria-selected');
  });

  it('shows a tri-state checkbox mapped to aria-checked when checkable', () => {
    const { item } = renderItem({ checkable: true, checkState: 'indeterminate' });
    expect(item).toHaveAttribute('aria-checked', 'mixed');
    expect(item).not.toHaveAttribute('aria-selected');
    expect(item.querySelector('[data-slot="tree-checkbox"]')).toHaveAttribute(
      'data-state',
      'indeterminate',
    );
  });

  it('marks a disabled node', () => {
    const { item } = renderItem({
      flat: { ...branch, node: { ...branch.node, disabled: true } },
    });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveClass('cursor-not-allowed');
  });

  it('toggles from the chevron without activating the row, and activates from the row', async () => {
    const user = userEvent.setup();
    const { item, handlers, onToggleExpanded } = renderItem();
    const toggle = item.querySelector('[data-slot="tree-toggle"]');
    if (!toggle) {
      throw new Error('no toggle');
    }
    await user.click(toggle);
    expect(onToggleExpanded).toHaveBeenCalledWith('hq', true);
    expect(handlers.onActivate).not.toHaveBeenCalled();
    await user.click(screen.getByText('Headquarters'));
    expect(handlers.onActivate).toHaveBeenCalledTimes(1);
  });

  it('renders the label through renderNode with the node state', () => {
    renderItem({
      selected: true,
      renderNode: (node, state) => `${node.label} @${state.depth} ${String(state.selected)}`,
    });
    expect(screen.getByText('Headquarters @1 true')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { item } = renderItem();
    await expectNoA11yViolations(item.parentElement ?? item);
  });
});

describe('TreeStatusRow', () => {
  it('shows the loading label as a busy, disabled row', () => {
    const { item } = renderStatus();
    expect(item).toHaveTextContent('Loading…');
    expect(item).toHaveAttribute('aria-busy', 'true');
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveAttribute('aria-level', '2');
    expect(item.style.paddingInlineStart).toBe('calc(3.5rem)');
  });

  it('shows the error label and activates on click to retry', async () => {
    const user = userEvent.setup();
    const { item, handlers } = renderStatus({ state: 'error' });
    expect(item).toHaveTextContent('Could not load.');
    expect(item).not.toHaveAttribute('aria-busy');
    await user.click(item);
    expect(handlers.onActivate).toHaveBeenCalledTimes(1);
  });
});
