import { afterEach, describe, expect, it, vi } from 'vitest';
import { csvFilename, downloadCsv, toCsv, toLatinDigits, type CsvColumn } from '@/lib/table-export';

interface Row {
  name: unknown;
  amount?: unknown;
  when?: unknown;
}

const columns: CsvColumn<Row>[] = [
  { header: 'Name', value: (row) => row.name },
  { header: 'Amount', value: (row) => row.amount },
  { header: 'When', value: (row) => row.when },
];

function csv(rows: Row[], options?: Parameters<typeof toCsv>[2]) {
  return toCsv(columns, rows, options);
}

function body(text: string): string[] {
  return text.replace(/^﻿/, '').split('\r\n');
}

describe('toCsv structure', () => {
  it('starts with a UTF-8 byte order mark by default and can leave it out', () => {
    expect(csv([{ name: 'a' }]).startsWith('﻿')).toBe(true);
    expect(csv([{ name: 'a' }], { bom: false }).startsWith('﻿')).toBe(false);
  });

  it('separates records with CRLF and writes the header first', () => {
    const text = csv([
      { name: 'a', amount: 1 },
      { name: 'b', amount: 2 },
    ]);
    expect(text).toContain('\r\n');
    expect(text.replace(/\r\n/g, '')).not.toContain('\n');
    expect(body(text)).toEqual(['Name,Amount,When', 'a,1,', 'b,2,']);
  });

  it('can skip the header and use a semicolon delimiter', () => {
    expect(body(csv([{ name: 'a', amount: 1 }], { includeHeader: false, delimiter: ';' }))).toEqual(
      ['a;1;'],
    );
    expect(csv([{ name: 'a,b' }], { delimiter: ';', includeHeader: false })).toContain('a,b;');
  });

  it('writes only the header for no rows', () => {
    expect(body(csv([]))).toEqual(['Name,Amount,When']);
  });
});

describe('toCsv escaping', () => {
  it('quotes cells with a delimiter, a quote or a line break and doubles the quotes', () => {
    const lines = csv([
      { name: 'a,b' },
      { name: 'say "hi"' },
      { name: 'line\nbreak' },
      { name: 'cr\rbreak' },
    ]);
    expect(lines).toContain('"a,b"');
    expect(lines).toContain('"say ""hi"""');
    expect(lines).toContain('"line\nbreak"');
    expect(lines).toContain('"cr\rbreak"');
  });

  it('quotes cells with leading or trailing spaces so they survive', () => {
    expect(csv([{ name: ' padded ' }])).toContain('" padded "');
  });

  it('leaves plain cells unquoted', () => {
    expect(body(csv([{ name: 'plain' }]))[1]).toBe('plain,,');
  });
});

describe('toCsv formula injection guard', () => {
  const single: CsvColumn<{ cell: unknown }>[] = [{ header: 'Cell', value: (row) => row.cell }];
  const lineOf = (cell: unknown) => toCsv(single, [{ cell }], { includeHeader: false, bom: false });

  it.each(['=1+1', '+SUM(A1)', '-2+3', '@cmd'])('prefixes %j', (value) => {
    expect(lineOf(value)).toBe(`'${value}`);
  });

  it('prefixes cells starting with a tab or a carriage return (and quotes the latter)', () => {
    expect(lineOf('\t=1')).toBe("'\t=1");
    expect(lineOf('\r=1')).toBe('"\'\r=1"');
  });

  it('does not touch real numbers, negative ones included', () => {
    expect(body(csv([{ name: 'n', amount: -5 }]))[1]).toBe('n,-5,');
  });

  it('does not prefix ordinary text and can be switched off', () => {
    expect(body(csv([{ name: 'a=b' }]))[1]).toBe('a=b,,');
    expect(body(csv([{ name: '=1' }], { guardFormulas: false }))[1]).toBe('=1,,');
  });

  it('guards the header row too', () => {
    const text = toCsv([{ header: '=evil', value: () => 'x' }], [{}]);
    expect(body(text)[0]).toBe("'=evil");
  });

  it('guards each item of an array cell', () => {
    expect(lineOf(['ok', '=bad'])).toBe("ok; '=bad");
  });
});

describe('toCsv values', () => {
  it('writes Arabic text unchanged', () => {
    const text = csv([{ name: 'شركة الأفق للسياحة' }, { name: 'مكتب، الواحة' }]);
    expect(text).toContain('شركة الأفق للسياحة');
    // The Arabic comma is not the delimiter, so no quoting is needed for it.
    expect(text).toContain('\r\nمكتب، الواحة');
  });

  it('turns Arabic-Indic and Persian digits into Latin digits', () => {
    expect(toLatinDigits('رقم ١٢٣٤٥٦٧٨٩٠ و ۱۲۳')).toBe('رقم 1234567890 و 123');
    expect(body(csv([{ name: '٠٧٧٠١٢٣٤' }]))[1]).toBe('07701234,,');
    expect(body(csv([{ name: '٠٧٧٠١٢٣٤' }], { latinDigits: false }))[1]).toBe('٠٧٧٠١٢٣٤,,');
  });

  it('writes numbers with Latin digits and no grouping', () => {
    expect(body(csv([{ name: 'n', amount: 1234567.5 }]))[1]).toBe('n,1234567.5,');
    expect(body(csv([{ name: 'n', amount: -0 }]))[1]).toBe('n,0,');
    expect(body(csv([{ name: 'n', amount: Number.NaN }]))[1]).toBe('n,,');
    expect(body(csv([{ name: 'n', amount: 10n }]))[1]).toBe('n,10,');
  });

  it('writes dates as ISO 8601, full or date only, and invalid dates as empty', () => {
    const when = new Date('2025-03-01T10:20:30Z');
    expect(body(csv([{ name: 'd', when }]))[1]).toBe('d,,2025-03-01T10:20:30.000Z');
    expect(body(csv([{ name: 'd', when }], { dateFormat: 'date' }))[1]).toBe('d,,2025-03-01');
    expect(body(csv([{ name: 'd', when: new Date('nope') }]))[1]).toBe('d,,');
  });

  it('writes booleans, null, undefined, and objects', () => {
    expect(body(csv([{ name: true, amount: null, when: undefined }]))[1]).toBe('true,,');
    expect(body(csv([{ name: false }]))[1]).toBe('false,,');
    expect(csv([{ name: { a: 1 } }])).toContain('"{""a"":1}"');
  });
});

describe('csvFilename', () => {
  it('adds the extension once and removes characters browsers reject', () => {
    expect(csvFilename('report')).toBe('report.csv');
    expect(csvFilename('report.CSV')).toBe('report.csv');
    expect(csvFilename('a/b\\c:d')).toBe('a-b-c-d.csv');
    expect(csvFilename('  ')).toBe('export.csv');
    expect(csvFilename('تقرير الحجوزات')).toBe('تقرير الحجوزات.csv');
  });
});

function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(
        reader.result instanceof ArrayBuffer ? new Uint8Array(reader.result) : new Uint8Array(),
      );
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

describe('downloadCsv', () => {
  const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    Object.assign(URL, { createObjectURL: original.create, revokeObjectURL: original.revoke });
  });

  it('saves a UTF-8 blob through a temporary link, then removes the link and the url', async () => {
    vi.useFakeTimers();
    let saved: Blob | undefined;
    const createObjectURL = vi.fn((blob: Blob) => {
      saved = blob;
      return 'blob:test';
    });
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clicked: { href: string; download: string; connected: boolean }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download, connected: this.isConnected });
    });

    expect(downloadCsv('bookings', toCsv(columns, [{ name: 'مكتب' }]))).toBe(true);

    expect(clicked).toEqual([{ href: 'blob:test', download: 'bookings.csv', connected: true }]);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(saved?.type).toBe('text/csv;charset=utf-8');
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    // jsdom's FileReader needs real timers.
    vi.useRealTimers();
    const bytes = saved ? await readBytes(saved) : new Uint8Array();
    expect(Array.from(bytes.subarray(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toContain('مكتب');
  });

  it('does nothing when the browser cannot create object urls', () => {
    Object.assign(URL, { createObjectURL: undefined });
    expect(downloadCsv('x', 'a')).toBe(false);
  });

  it('does nothing without a DOM (server rendering)', () => {
    vi.stubGlobal('document', undefined);
    try {
      expect(downloadCsv('x', 'a')).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
