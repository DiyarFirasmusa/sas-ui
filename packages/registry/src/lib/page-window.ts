export type PageWindowItem = number | 'start-ellipsis' | 'end-ellipsis';

/**
 * The page numbers to show: always the first and last page, the current page
 * with `siblings` neighbours on each side, and an ellipsis wherever pages are
 * skipped. The list keeps a constant length while the current page moves, so
 * the controls do not jump under the pointer.
 */
export function getPageWindow(page: number, pageCount: number, siblings = 1): PageWindowItem[] {
  if (pageCount < 1) {
    return [];
  }
  const current = Math.min(Math.max(page, 1), pageCount);
  const edge = 3 + 2 * siblings; // first/last page + ellipsis + the sibling block
  if (pageCount <= edge + 2) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, pageCount);
  const showStart = left > 2;
  const showEnd = right < pageCount - 1;

  if (!showStart && showEnd) {
    const head = Array.from({ length: edge }, (_, index) => index + 1);
    return [...head, 'end-ellipsis', pageCount];
  }
  if (showStart && !showEnd) {
    const tail = Array.from({ length: edge }, (_, index) => pageCount - edge + 1 + index);
    return [1, 'start-ellipsis', ...tail];
  }
  const middle = Array.from({ length: right - left + 1 }, (_, index) => left + index);
  return [1, 'start-ellipsis', ...middle, 'end-ellipsis', pageCount];
}

/** Number of pages for a total and page size; at least 1 so an empty list still has a page. */
export function getPageCount(total: number, pageSize: number): number {
  if (pageSize < 1) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

/** 1-based inclusive row range shown on a page, or null when there are no rows. */
export function getRowRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } | null {
  if (total < 1 || pageSize < 1) {
    return null;
  }
  const from = (Math.max(page, 1) - 1) * pageSize + 1;
  if (from > total) {
    return null;
  }
  return { from, to: Math.min(from + pageSize - 1, total) };
}
