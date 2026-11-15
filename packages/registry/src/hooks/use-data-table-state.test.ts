import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDataTableState, type UseDataTableStateOptions } from '@/hooks/use-data-table-state';

function setup(options: Partial<UseDataTableStateOptions> = {}) {
  return renderHook(
    (props: Partial<UseDataTableStateOptions>) => useDataTableState({ selectable: true, ...props }),
    { initialProps: options },
  );
}

describe('useDataTableState', () => {
  it('starts empty and keeps selection inside when uncontrolled', () => {
    const onRowSelectionChange = vi.fn();
    const { result } = setup({ onRowSelectionChange });
    expect(result.current.rowSelection).toEqual({});
    act(() => result.current.setSelection({ p1: true }));
    expect(result.current.rowSelection).toEqual({ p1: true });
    expect(onRowSelectionChange).toHaveBeenCalledWith({ p1: true });
  });

  it('applies functional updates from TanStack on top of the current selection', () => {
    const { result } = setup();
    act(() => result.current.setSelection({ p1: true }));
    act(() => result.current.handleSelectionChange((previous) => ({ ...previous, p2: true })));
    expect(result.current.rowSelection).toEqual({ p1: true, p2: true });
  });

  it('follows a controlled selection and only reports changes', () => {
    const onRowSelectionChange = vi.fn();
    const { result } = setup({ rowSelection: { p3: true }, onRowSelectionChange });
    act(() => result.current.setSelection({}));
    expect(onRowSelectionChange).toHaveBeenCalledWith({});
    expect(result.current.rowSelection).toEqual({ p3: true });
  });

  it('keeps and reports column visibility, controlled or not', () => {
    const onColumnVisibilityChange = vi.fn();
    const inner = setup({ onColumnVisibilityChange });
    act(() => inner.result.current.handleVisibilityChange({ city: false }));
    expect(inner.result.current.columnVisibility).toEqual({ city: false });
    expect(onColumnVisibilityChange).toHaveBeenCalledWith({ city: false });

    const controlled = setup({ columnVisibility: { age: false }, onColumnVisibilityChange });
    act(() =>
      controlled.result.current.handleVisibilityChange((previous) => ({
        ...previous,
        city: false,
      })),
    );
    expect(controlled.result.current.columnVisibility).toEqual({ age: false });
    expect(onColumnVisibilityChange).toHaveBeenLastCalledWith({ age: false, city: false });
  });

  it('clears a selection only when the table is selectable and has one', () => {
    const onRowSelectionChange = vi.fn();
    const empty = setup({ onRowSelectionChange });
    act(() => empty.result.current.clearSelectionIfAny());
    expect(onRowSelectionChange).not.toHaveBeenCalled();

    const filled = setup({ rowSelection: { p1: true }, onRowSelectionChange });
    act(() => filled.result.current.clearSelectionIfAny());
    expect(onRowSelectionChange).toHaveBeenCalledWith({});

    onRowSelectionChange.mockClear();
    const notSelectable = setup({
      selectable: false,
      rowSelection: { p1: true },
      onRowSelectionChange,
    });
    act(() => notSelectable.result.current.clearSelectionIfAny());
    expect(onRowSelectionChange).not.toHaveBeenCalled();
  });
});
