/**
 * What a column can say about itself through TanStack's `meta`. TanStack types
 * `meta` as an open interface, so it is read through `readColumnMeta`, which
 * checks each field instead of trusting a cast.
 */
export interface DataTableColumnMeta {
  /** Plain-text name for the column menu and mobile cards, for columns whose header is not a string. */
  label?: string;
  /** Logical alignment; numbers should use `numeric` instead. */
  align?: 'start' | 'center' | 'end';
  /** End-aligned with tabular digits. */
  numeric?: boolean;
  /** Pin to the start or end edge while the table scrolls sideways. */
  sticky?: 'start' | 'end';
  /**
   * Place in the mobile card: `title` is the card heading, `actions` goes in
   * the corner, `hidden` is left out, `field` (default) is a label/value line.
   */
  cardRole?: 'title' | 'field' | 'actions' | 'hidden';
  className?: string;
  headerClassName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readColumnMeta(meta: unknown): DataTableColumnMeta {
  if (!isRecord(meta)) {
    return {};
  }
  const result: DataTableColumnMeta = {};
  if (typeof meta.label === 'string') {
    result.label = meta.label;
  }
  if (meta.align === 'start' || meta.align === 'center' || meta.align === 'end') {
    result.align = meta.align;
  }
  if (typeof meta.numeric === 'boolean') {
    result.numeric = meta.numeric;
  }
  if (meta.sticky === 'start' || meta.sticky === 'end') {
    result.sticky = meta.sticky;
  }
  if (
    meta.cardRole === 'title' ||
    meta.cardRole === 'field' ||
    meta.cardRole === 'actions' ||
    meta.cardRole === 'hidden'
  ) {
    result.cardRole = meta.cardRole;
  }
  if (typeof meta.className === 'string') {
    result.className = meta.className;
  }
  if (typeof meta.headerClassName === 'string') {
    result.headerClassName = meta.headerClassName;
  }
  return result;
}
