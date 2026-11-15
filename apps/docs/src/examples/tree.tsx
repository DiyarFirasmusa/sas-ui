import { useState } from 'react';
import { Tree } from '@/components/ui/tree';
import { collapseChecked, type TreeNode } from '@/lib/tree-utils';
import type { Example } from '../example-types';

const organisation: TreeNode[] = [
  {
    id: 'hq',
    label: 'Head office',
    children: [
      {
        id: 'finance',
        label: 'Finance',
        children: [
          { id: 'payables', label: 'Accounts payable' },
          { id: 'receivables', label: 'Accounts receivable' },
          { id: 'audit', label: 'Internal audit', disabled: true },
        ],
      },
      { id: 'hr', label: 'Human resources' },
    ],
  },
  {
    id: 'north',
    label: 'الفرع الشمالي',
    children: [
      { id: 'north-sales', label: 'المبيعات' },
      { id: 'north-ops', label: 'العمليات' },
    ],
  },
  { id: 'online', label: 'Online store' },
];

function Checkable() {
  const [checked, setChecked] = useState<string[]>(['payables']);
  return (
    <div className="gap-field flex flex-col">
      <Tree
        aria-label="Units"
        nodes={organisation}
        checkable
        checked={checked}
        onCheckedChange={setChecked}
        defaultExpanded={['hq', 'finance']}
      />
      <p className="text-b2 text-text-muted" dir="ltr">
        Value: {collapseChecked(organisation, checked).join(', ') || 'none'}
      </p>
    </div>
  );
}

function lazyChildren(node: TreeNode): Promise<TreeNode[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        node.id === 'root' || node.id.endsWith('-group')
          ? [1, 2, 3].map((index) => ({
              id: `${node.id}-${index}`,
              label: `${node.label} ${index}`,
              hasChildren: node.id === 'root' && index === 1,
            }))
          : [],
      );
    }, 700);
  });
}

export const examples: Example[] = [
  {
    title: 'Single selection',
    description:
      'Arrow keys move, Right/Left open and close (mirrored in RTL), Home/End jump, Enter or Space select.',
    render: () => (
      <Tree
        aria-label="Units"
        nodes={organisation}
        defaultExpanded={['hq']}
        defaultSelected={['hr']}
      />
    ),
  },
  {
    title: 'Checkboxes with tri-state parents',
    description: 'Checking a branch checks everything below it; disabled nodes are left alone.',
    render: () => <Checkable />,
  },
  {
    title: 'Navigation tree (no selection)',
    render: () => <Tree aria-label="Units" nodes={organisation} selectionMode="none" />,
  },
  {
    title: 'Lazy loading',
    description: 'Children load when a branch opens; failures show an inline retry row.',
    render: () => (
      <Tree
        aria-label="Lazy units"
        nodes={[{ id: 'root', label: 'Region', hasChildren: true }]}
        loadChildren={lazyChildren}
        defaultExpanded={['root']}
      />
    ),
  },
  {
    title: 'Loading, error and empty',
    render: () => (
      <div className="gap-row flex flex-col">
        <Tree aria-label="Loading" nodes={[]} loading />
        <Tree aria-label="Error" nodes={[]} error onRetry={() => {}} />
        <Tree aria-label="Empty" nodes={[]} />
      </div>
    ),
  },
];
