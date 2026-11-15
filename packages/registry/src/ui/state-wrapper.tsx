import type { ReactNode } from 'react';
import { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';
import { ErrorState, type ErrorStateProps } from '@/components/ui/error-state';
import { SkeletonText } from '@/components/ui/skeleton';

/** The four states every async view has, as a union so none can be forgotten. */
type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message?: ReactNode }
  | { status: 'success'; data: T };

interface QueryLike<T> {
  isPending: boolean;
  isError: boolean;
  data: T | undefined;
  error?: unknown;
}

/**
 * Adapts a TanStack Query-shaped result to `AsyncState`. `describeError` turns
 * the error into text the user can read (the app's own API-error resolver).
 */
function asyncStateFromQuery<T>(
  query: QueryLike<T>,
  describeError?: (error: unknown) => ReactNode,
): AsyncState<T> {
  if (query.isError) {
    return { status: 'error', message: describeError?.(query.error) };
  }
  if (query.isPending || query.data === undefined) {
    return { status: 'loading' };
  }
  return { status: 'success', data: query.data };
}

interface StateWrapperProps<T> {
  state: AsyncState<T>;
  /** Decides when a successful result counts as empty (e.g. an empty list). */
  isEmpty?: (data: T) => boolean;
  /** Shown while loading. Defaults to a text skeleton. */
  loading?: ReactNode;
  /** Props for the built-in empty state, or a custom node. */
  empty?: EmptyStateProps | ReactNode;
  /** Props for the built-in error state (`onRetry`, `retrying`…). */
  error?: Pick<ErrorStateProps, 'onRetry' | 'retrying' | 'title' | 'description' | 'kind'>;
  className?: string;
  children: (data: T) => ReactNode;
}

function isElement(value: unknown): value is ReactNode {
  return typeof value !== 'object' || value === null || '$$typeof' in value;
}

/**
 * One place for loading / error / empty / success so no view forgets a state.
 * The error and empty views are the library's `ErrorState` / `EmptyState`.
 */
function StateWrapper<T>({
  state,
  isEmpty,
  loading,
  empty,
  error,
  className,
  children,
}: StateWrapperProps<T>) {
  if (state.status === 'loading') {
    return <div className={className}>{loading ?? <SkeletonText lines={4} />}</div>;
  }
  if (state.status === 'error') {
    return (
      <div className={className}>
        <ErrorState description={state.message} {...error} />
      </div>
    );
  }
  if (isEmpty?.(state.data) === true) {
    return (
      <div className={className}>
        {empty === undefined || !isElement(empty) ? <EmptyState {...empty} /> : empty}
      </div>
    );
  }
  return <>{children(state.data)}</>;
}

export { StateWrapper, asyncStateFromQuery };
export type { AsyncState, StateWrapperProps };
