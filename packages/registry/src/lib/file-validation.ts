/**
 * Pure validation and formatting for file inputs. No DOM access, so the same
 * rules run for browse, drag-and-drop and paste, and are easy to unit test.
 */

export type FileRejectionCode =
  | 'file-invalid-type'
  | 'file-too-large'
  | 'file-too-small'
  | 'too-many-files'
  | 'duplicate';

export interface FileRejection {
  file: File;
  code: FileRejectionCode;
}

export interface FileRules {
  /** Same syntax as `<input accept>`: `.pdf`, `image/*`, `image/png`, comma separated. */
  accept?: string;
  /** Bytes, per file. */
  maxSize?: number;
  minSize?: number;
  /** Most files the list may hold (only meaningful with `multiple`). */
  maxFiles?: number;
  multiple?: boolean;
}

export interface FileValidationResult {
  /** The list after this batch: existing files plus the newly accepted ones. */
  files: File[];
  accepted: File[];
  rejected: FileRejection[];
}

/** Stable identity of a file across renders (File objects have no id). */
export function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function parseAccept(accept: string | undefined): string[] {
  return (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== '');
}

/** True when the file matches any `accept` token (or there are none). */
export function matchesAccept(
  file: Pick<File, 'name' | 'type'>,
  accept: string | undefined,
): boolean {
  const tokens = parseAccept(accept);
  if (tokens.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return name.endsWith(token);
    }
    if (token.endsWith('/*')) {
      return type.startsWith(token.slice(0, -1));
    }
    return type === token;
  });
}

export function isImageFile(file: Pick<File, 'type'>): boolean {
  return file.type.toLowerCase().startsWith('image/');
}

/** The first rule a single file breaks, or null when it is fine. */
export function validateFile(
  file: File,
  { accept, maxSize, minSize }: Pick<FileRules, 'accept' | 'maxSize' | 'minSize'>,
): FileRejectionCode | null {
  if (!matchesAccept(file, accept)) {
    return 'file-invalid-type';
  }
  if (maxSize !== undefined && file.size > maxSize) {
    return 'file-too-large';
  }
  if (minSize !== undefined && file.size < minSize) {
    return 'file-too-small';
  }
  return null;
}

/**
 * Validates a batch against the rules and the files already held. Every file
 * gets either accepted or a rejection with its own reason, in input order.
 * Without `multiple` the list holds at most one file: a valid file replaces
 * the current one and extra files in the batch are rejected.
 */
export function validateFiles(
  incoming: readonly File[],
  existing: readonly File[],
  rules: FileRules = {},
): FileValidationResult {
  const rejected: FileRejection[] = [];
  const accepted: File[] = [];
  const single = !rules.multiple;
  const known = new Set(single ? [] : existing.map(fileKey));
  const capacity = single
    ? 1
    : rules.maxFiles === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(0, rules.maxFiles - existing.length);

  for (const file of incoming) {
    const problem = validateFile(file, rules);
    if (problem) {
      rejected.push({ file, code: problem });
    } else if (known.has(fileKey(file))) {
      rejected.push({ file, code: 'duplicate' });
    } else if (accepted.length >= capacity) {
      rejected.push({ file, code: 'too-many-files' });
    } else {
      known.add(fileKey(file));
      accepted.push(file);
    }
  }

  const files = single
    ? accepted.length > 0
      ? accepted
      : [...existing]
    : [...existing, ...accepted];
  return { files, accepted, rejected };
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

/**
 * `1.5 MB` / `1.5 ميغابايت`: 1024-based, unit names from Intl. Latin digits
 * unless `numerals: 'locale'`.
 */
export function formatFileSize(
  bytes: number,
  { locale = 'en', numerals = 'latn' }: { locale?: string; numerals?: 'latn' | 'locale' } = {},
): string {
  const base = locale === 'ar' ? 'ar-IQ' : locale === 'en' ? 'en-US' : locale;
  const isArabic = base.toLowerCase().startsWith('ar');
  const tag = numerals === 'latn' ? `${base}-u-nu-latn` : isArabic ? `${base}-u-nu-arab` : base;
  const exponent = Math.min(
    UNITS.length - 1,
    bytes < 1 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const unit = UNITS[exponent] ?? 'byte';
  return new Intl.NumberFormat(tag, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: exponent === 0 ? 0 : 1,
  }).format(bytes / 1024 ** exponent);
}
