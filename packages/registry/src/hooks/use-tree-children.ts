import { useCallback, useRef, useState } from 'react';
import type { TreeNode } from '@/lib/tree-utils';

type TreeLoadStatus = 'loading' | 'error';

/**
 * Lazy children of a tree: what `loadChildren` returned per node id, which
 * nodes are loading or failed, and `retry` to ask again after a failure.
 * A node is requested once at a time, so calling `load` for the same node
 * while it is in flight (or already loaded) does nothing.
 */
function useTreeChildren<TData>(
  loadChildren?: (node: TreeNode<TData>) => Promise<TreeNode<TData>[]>,
) {
  const [loaded, setLoaded] = useState<Record<string, TreeNode<TData>[]>>({});
  const [status, setStatus] = useState<Record<string, TreeLoadStatus>>({});
  const requested = useRef(new Set<string>());

  const load = useCallback(
    (node: TreeNode<TData>) => {
      if (!loadChildren || requested.current.has(node.id)) {
        return;
      }
      requested.current.add(node.id);
      setStatus((previous) => ({ ...previous, [node.id]: 'loading' }));
      loadChildren(node).then(
        (children) => {
          setLoaded((previous) => ({ ...previous, [node.id]: children }));
          setStatus(({ [node.id]: _done, ...rest }) => rest);
        },
        () => {
          requested.current.delete(node.id);
          setStatus((previous) => ({ ...previous, [node.id]: 'error' }));
        },
      );
    },
    [loadChildren],
  );

  function retry(parentId: string) {
    requested.current.delete(parentId);
    setStatus(({ [parentId]: _cleared, ...rest }) => rest);
  }

  return { loaded, status, load, retry };
}

export { useTreeChildren };
export type { TreeLoadStatus };
