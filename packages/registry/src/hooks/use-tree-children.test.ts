import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTreeChildren } from '@/hooks/use-tree-children';
import type { TreeNode } from '@/lib/tree-utils';

const parent: TreeNode = { id: 'p', label: 'Parent', hasChildren: true };
const kids: TreeNode[] = [{ id: 'k', label: 'Kid' }];

describe('useTreeChildren', () => {
  it('starts with nothing loaded', () => {
    const { result } = renderHook(() => useTreeChildren(vi.fn()));
    expect(result.current.loaded).toEqual({});
    expect(result.current.status).toEqual({});
  });

  it('marks a node loading, then stores its children and clears the status', async () => {
    let resolve: (nodes: TreeNode[]) => void = () => {};
    const loadChildren = vi.fn(
      () =>
        new Promise<TreeNode[]>((done) => {
          resolve = done;
        }),
    );
    const { result } = renderHook(() => useTreeChildren(loadChildren));
    act(() => result.current.load(parent));
    expect(result.current.status).toEqual({ p: 'loading' });
    expect(loadChildren).toHaveBeenCalledWith(parent);

    await act(async () => resolve(kids));
    expect(result.current.loaded).toEqual({ p: kids });
    expect(result.current.status).toEqual({});
  });

  it('asks only once per node while it is in flight or loaded', async () => {
    const loadChildren = vi.fn(() => Promise.resolve(kids));
    const { result } = renderHook(() => useTreeChildren(loadChildren));
    act(() => {
      result.current.load(parent);
      result.current.load(parent);
    });
    await waitFor(() => expect(result.current.loaded).toEqual({ p: kids }));
    act(() => result.current.load(parent));
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it('records a failure and loads again after retry', async () => {
    const loadChildren = vi
      .fn<(node: TreeNode) => Promise<TreeNode[]>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(kids);
    const { result } = renderHook(() => useTreeChildren(loadChildren));
    act(() => result.current.load(parent));
    await waitFor(() => expect(result.current.status).toEqual({ p: 'error' }));

    act(() => result.current.retry('p'));
    expect(result.current.status).toEqual({});
    act(() => result.current.load(parent));
    await waitFor(() => expect(result.current.loaded).toEqual({ p: kids }));
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });

  it('does nothing without a loader', () => {
    const { result } = renderHook(() => useTreeChildren<unknown>());
    act(() => result.current.load(parent));
    expect(result.current.status).toEqual({});
  });
});
