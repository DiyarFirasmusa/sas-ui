import {
  functionalUpdate,
  type OnChangeFn,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useState } from 'react';

interface UseDataTableStateOptions {
  selectable: boolean;
  /** Controlled selection; the hook keeps its own when this is undefined. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /** Controlled column visibility; the hook keeps its own when this is undefined. */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

/**
 * Row selection and column visibility of a data table, each controlled or
 * kept inside, in the shape TanStack's `onChange` options expect.
 */
function useDataTableState({
  selectable,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  columnVisibility: visibilityProp,
  onColumnVisibilityChange,
}: UseDataTableStateOptions) {
  const [innerSelection, setInnerSelection] = useState<RowSelectionState>({});
  const [innerVisibility, setInnerVisibility] = useState<VisibilityState>({});
  const rowSelection = rowSelectionProp ?? innerSelection;
  const columnVisibility = visibilityProp ?? innerVisibility;

  function setSelection(next: RowSelectionState) {
    if (rowSelectionProp === undefined) {
      setInnerSelection(next);
    }
    onRowSelectionChange?.(next);
  }

  const handleSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    setSelection(functionalUpdate(updater, rowSelection));
  };

  const handleVisibilityChange: OnChangeFn<VisibilityState> = (updater) => {
    const next = functionalUpdate(updater, columnVisibility);
    if (visibilityProp === undefined) {
      setInnerVisibility(next);
    }
    onColumnVisibilityChange?.(next);
  };

  // A selection is about the rows of one page: a new page or sort clears it.
  function clearSelectionIfAny() {
    if (selectable && Object.keys(rowSelection).length > 0) {
      setSelection({});
    }
  }

  return {
    rowSelection,
    columnVisibility,
    setSelection,
    handleSelectionChange,
    handleVisibilityChange,
    clearSelectionIfAny,
  };
}

export { useDataTableState };
export type { UseDataTableStateOptions };
