import { describe, expect, it } from 'vitest';
import { readColumnMeta } from '@/lib/data-table-meta';

describe('readColumnMeta', () => {
  it('reads every supported field', () => {
    expect(
      readColumnMeta({
        label: 'Amount',
        align: 'center',
        numeric: true,
        sticky: 'end',
        cardRole: 'title',
        className: 'a',
        headerClassName: 'b',
      }),
    ).toEqual({
      label: 'Amount',
      align: 'center',
      numeric: true,
      sticky: 'end',
      cardRole: 'title',
      className: 'a',
      headerClassName: 'b',
    });
  });

  it('returns an empty object for missing or non-object meta', () => {
    expect(readColumnMeta(undefined)).toEqual({});
    expect(readColumnMeta(null)).toEqual({});
    expect(readColumnMeta('x')).toEqual({});
  });

  it('drops fields of the wrong type or value', () => {
    expect(
      readColumnMeta({
        label: 5,
        align: 'left',
        numeric: 'yes',
        sticky: 'left',
        cardRole: 'big',
        className: 1,
      }),
    ).toEqual({});
  });

  it('ignores unrelated keys', () => {
    expect(readColumnMeta({ custom: true, label: 'X' })).toEqual({
      label: 'X',
    });
  });
});
