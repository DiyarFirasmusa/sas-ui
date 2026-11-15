export interface DiffResult {
  changed: boolean;
  /** Unified-style hunks with 3 lines of context; empty when unchanged. */
  text: string;
  added: number;
  removed: number;
}

type Operation = { kind: ' ' | '+' | '-'; line: string };

function operations(before: string[], after: string[]): Operation[] {
  // LCS table; registry files stay under 500 lines so O(n·m) is fine.
  const rows = before.length + 1;
  const columns = after.length + 1;
  const table: number[] = Array.from({ length: rows * columns }, () => 0);
  const at = (row: number, column: number) => table[row * columns + column] ?? 0;
  for (let row = before.length - 1; row >= 0; row -= 1) {
    for (let column = after.length - 1; column >= 0; column -= 1) {
      table[row * columns + column] =
        before[row] === after[column]
          ? at(row + 1, column + 1) + 1
          : Math.max(at(row + 1, column), at(row, column + 1));
    }
  }
  const result: Operation[] = [];
  let row = 0;
  let column = 0;
  while (row < before.length && column < after.length) {
    if (before[row] === after[column]) {
      result.push({ kind: ' ', line: before[row] ?? '' });
      row += 1;
      column += 1;
    } else if (at(row + 1, column) >= at(row, column + 1)) {
      result.push({ kind: '-', line: before[row] ?? '' });
      row += 1;
    } else {
      result.push({ kind: '+', line: after[column] ?? '' });
      column += 1;
    }
  }
  for (; row < before.length; row += 1) {
    result.push({ kind: '-', line: before[row] ?? '' });
  }
  for (; column < after.length; column += 1) {
    result.push({ kind: '+', line: after[column] ?? '' });
  }
  return result;
}

const CONTEXT = 3;

/** `before` is the local file, `after` the registry version. */
export function unifiedDiff(before: string, after: string): DiffResult {
  if (before === after) {
    return { changed: false, text: '', added: 0, removed: 0 };
  }
  const steps = operations(before.split('\n'), after.split('\n'));
  const keep = Array.from({ length: steps.length }, () => false);
  steps.forEach((step, index) => {
    if (step.kind !== ' ') {
      for (let near = Math.max(0, index - CONTEXT); near <= Math.min(steps.length - 1, index + CONTEXT); near += 1) {
        keep[near] = true;
      }
    }
  });
  const lines: string[] = [];
  let skipping = false;
  steps.forEach((step, index) => {
    if (keep[index]) {
      lines.push(`${step.kind}${step.line}`);
      skipping = false;
    } else if (!skipping) {
      lines.push('@@ … @@');
      skipping = true;
    }
  });
  return {
    changed: true,
    text: lines.join('\n'),
    added: steps.filter((step) => step.kind === '+').length,
    removed: steps.filter((step) => step.kind === '-').length,
  };
}
