export interface CsvColumn<T> {
  header: string;
  /** The raw value of the cell: numbers stay numbers, dates stay dates. They are formatted here. */
  value: (row: T) => unknown;
}

export interface CsvOptions {
  /** Excel in many Arabic and European regions expects `;`. Default `,`. */
  delimiter?: ',' | ';';
  /** Prefix a UTF-8 byte order mark so Excel opens Arabic text correctly. Default true. */
  bom?: boolean;
  /** Write the header row. Default true. */
  includeHeader?: boolean;
  /** `iso` writes the full ISO 8601 timestamp, `date` only `YYYY-MM-DD`. Default `iso`. */
  dateFormat?: 'iso' | 'date';
  /** Turn Arabic-Indic and Persian digits inside text into Latin digits. Default true. */
  latinDigits?: boolean;
  /** Neutralise text that Excel would run as a formula (starts with = + - @ tab or CR). Default true. */
  guardFormulas?: boolean;
}

const BOM = '﻿';
const NEWLINE = '\r\n';
const FORMULA_START = /^[=+\-@\t\r]/;
const ARABIC_INDIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

/** `٠١٢٣٤٥٦٧٨٩` and `۰۱۲۳۴۵۶۷۸۹` to `0123456789`. */
export function toLatinDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= PERSIAN_ZERO ? code - PERSIAN_ZERO : code - ARABIC_INDIC_ZERO);
  });
}

function formatDate(date: Date, format: 'iso' | 'date'): string {
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return format === 'date' ? iso.slice(0, 10) : iso;
}

/** A cell's text before guarding and quoting. Numbers use plain Latin digits, never a locale format. */
function formatValue(
  value: unknown,
  options: Required<CsvOptions>,
): { text: string; isText: boolean } {
  if (value === null || value === undefined) {
    return { text: '', isText: false };
  }
  if (typeof value === 'number') {
    return { text: Number.isFinite(value) ? String(value === 0 ? 0 : value) : '', isText: false };
  }
  if (typeof value === 'bigint') {
    return { text: value.toString(), isText: false };
  }
  if (typeof value === 'boolean') {
    return { text: value ? 'true' : 'false', isText: false };
  }
  if (value instanceof Date) {
    return { text: formatDate(value, options.dateFormat), isText: false };
  }
  if (Array.isArray(value)) {
    const parts = value.map((part) => formatCell(part, options));
    return { text: parts.join('; '), isText: true };
  }
  if (typeof value === 'object') {
    return { text: JSON.stringify(value) ?? '', isText: true };
  }
  const text = typeof value === 'string' ? value : String(value);
  return { text: options.latinDigits ? toLatinDigits(text) : text, isText: true };
}

function guard(text: string, isText: boolean, options: Required<CsvOptions>): string {
  // Real numbers such as -5 are data, not formulas; only text can be a payload.
  return options.guardFormulas && isText && FORMULA_START.test(text) ? `'${text}` : text;
}

function formatCell(value: unknown, options: Required<CsvOptions>): string {
  const { text, isText } = formatValue(value, options);
  return guard(text, isText, options);
}

function quote(text: string, delimiter: string): string {
  const needsQuotes =
    text.includes(delimiter) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r') ||
    text !== text.trim();
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Builds CSV text that opens correctly in Excel, including Arabic: UTF-8 with a
 * byte order mark, `\r\n` between records, quotes doubled inside quoted cells,
 * text that would run as a formula prefixed with an apostrophe, numbers written
 * with Latin digits and dates as ISO 8601. Pass raw values, not formatted ones.
 */
export function toCsv<T>(
  columns: readonly CsvColumn<T>[],
  rows: readonly T[],
  options: CsvOptions = {},
): string {
  const resolved: Required<CsvOptions> = {
    delimiter: options.delimiter ?? ',',
    bom: options.bom ?? true,
    includeHeader: options.includeHeader ?? true,
    dateFormat: options.dateFormat ?? 'iso',
    latinDigits: options.latinDigits ?? true,
    guardFormulas: options.guardFormulas ?? true,
  };
  const line = (cells: string[]) =>
    cells.map((cell) => quote(cell, resolved.delimiter)).join(resolved.delimiter);
  const lines: string[] = [];
  if (resolved.includeHeader) {
    lines.push(line(columns.map((column) => guard(toLatinDigits(column.header), true, resolved))));
  }
  for (const row of rows) {
    lines.push(line(columns.map((column) => formatCell(column.value(row), resolved))));
  }
  return (resolved.bom ? BOM : '') + lines.join(NEWLINE);
}

/** A file name the browser will accept: no path or reserved characters, always ending in `.csv`. */
export function csvFilename(name: string): string {
  const cleaned = Array.from(name)
    .map((character) =>
      /[\\/:*?"<>|]/.test(character) || character.charCodeAt(0) < 32 ? '-' : character,
    )
    .join('')
    .trim();
  const base = cleaned.replace(/\.csv$/i, '') || 'export';
  return `${base}.csv`;
}

/**
 * Saves CSV text as a file through a temporary link. Returns false (and does
 * nothing) where there is no DOM, for example while rendering on the server.
 */
export function downloadCsv(filename: string, csv: string): boolean {
  if (
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return false;
  }
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = csvFilename(filename);
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Safari may still be reading the blob right after the click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
