import { describe, expect, it } from 'vitest';
import {
  fileKey,
  formatFileSize,
  isImageFile,
  matchesAccept,
  parseAccept,
  validateFile,
  validateFiles,
} from '@/lib/file-validation';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

function makeFile(name: string, size = 10, type = '', lastModified = 1): File {
  const file = new File(['x'], name, { type, lastModified });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('accept matching', () => {
  it('parses comma separated tokens', () => {
    expect(parseAccept(' .PDF, image/* ,, image/png')).toEqual(['.pdf', 'image/*', 'image/png']);
    expect(parseAccept(undefined)).toEqual([]);
    expect(parseAccept('')).toEqual([]);
  });

  it('accepts anything without a rule', () => {
    expect(matchesAccept(makeFile('a.bin'), undefined)).toBe(true);
    expect(matchesAccept(makeFile('a.bin'), '')).toBe(true);
  });

  it('matches extensions case-insensitively', () => {
    expect(matchesAccept(makeFile('Report.PDF'), '.pdf')).toBe(true);
    expect(matchesAccept(makeFile('report.pdf.exe'), '.pdf')).toBe(false);
    expect(matchesAccept(makeFile('scan.jpeg'), '.jpg,.jpeg')).toBe(true);
  });

  it('matches mime wildcards and exact types', () => {
    expect(matchesAccept(makeFile('a.png', 1, 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(makeFile('a.mp4', 1, 'video/mp4'), 'image/*')).toBe(false);
    expect(matchesAccept(makeFile('a.png', 1, 'image/png'), 'image/png')).toBe(true);
    expect(matchesAccept(makeFile('a.gif', 1, 'image/gif'), 'image/png')).toBe(false);
    expect(matchesAccept(makeFile('a.unknown', 1, ''), 'image/*')).toBe(false);
  });

  it('matches when any token fits', () => {
    expect(matchesAccept(makeFile('a.pdf', 1, 'application/pdf'), 'image/*,application/pdf')).toBe(
      true,
    );
    expect(matchesAccept(makeFile('a.docx', 1, ''), 'image/*,.docx')).toBe(true);
  });

  it('detects images', () => {
    expect(isImageFile(makeFile('a.png', 1, 'image/png'))).toBe(true);
    expect(isImageFile(makeFile('a.pdf', 1, 'application/pdf'))).toBe(false);
  });
});

describe('validateFile', () => {
  it('reports the first broken rule', () => {
    expect(
      validateFile(makeFile('a.txt', 5, 'text/plain'), {
        accept: 'image/*',
        maxSize: 1,
      }),
    ).toBe('file-invalid-type');
    expect(
      validateFile(makeFile('a.png', 5, 'image/png'), {
        accept: 'image/*',
        maxSize: 4,
      }),
    ).toBe('file-too-large');
    expect(validateFile(makeFile('a.png', 5, 'image/png'), { minSize: 6 })).toBe('file-too-small');
    expect(
      validateFile(makeFile('a.png', 5, 'image/png'), {
        accept: 'image/*',
        maxSize: 5,
        minSize: 5,
      }),
    ).toBeNull();
  });
});

describe('validateFiles', () => {
  it('accepts valid files and rejects each invalid one with its own code', () => {
    const good = makeFile('a.png', 100, 'image/png');
    const big = makeFile('b.png', 5000, 'image/png');
    const wrong = makeFile('c.txt', 10, 'text/plain');
    const result = validateFiles([good, big, wrong], [], {
      accept: 'image/*',
      maxSize: 1000,
      multiple: true,
    });
    expect(result.accepted).toEqual([good]);
    expect(result.files).toEqual([good]);
    expect(result.rejected).toEqual([
      { file: big, code: 'file-too-large' },
      { file: wrong, code: 'file-invalid-type' },
    ]);
  });

  it('appends to existing files in multiple mode', () => {
    const first = makeFile('a.png', 1, 'image/png');
    const second = makeFile('b.png', 1, 'image/png');
    expect(validateFiles([second], [first], { multiple: true }).files).toEqual([first, second]);
  });

  it('rejects duplicates against existing files and within the batch', () => {
    const first = makeFile('a.png', 1, 'image/png');
    const again = makeFile('a.png', 1, 'image/png');
    const result = validateFiles([again, again], [first], { multiple: true });
    expect(result.accepted).toEqual([]);
    expect(result.rejected.map((item) => item.code)).toEqual(['duplicate', 'duplicate']);
    const twice = validateFiles([again, again], [], { multiple: true });
    expect(twice.accepted).toHaveLength(1);
    expect(twice.rejected.map((item) => item.code)).toEqual(['duplicate']);
  });

  it('treats a file with another size or date as a different file', () => {
    expect(fileKey(makeFile('a', 1, '', 1))).not.toBe(fileKey(makeFile('a', 2, '', 1)));
    expect(fileKey(makeFile('a', 1, '', 1))).not.toBe(fileKey(makeFile('a', 1, '', 2)));
    expect(fileKey(makeFile('a', 1, '', 1))).toBe(fileKey(makeFile('a', 1, '', 1)));
  });

  it('enforces maxFiles counting what is already there', () => {
    const existing = [makeFile('a', 1), makeFile('b', 1)];
    const incoming = [makeFile('c', 1), makeFile('d', 1), makeFile('e', 1)];
    const result = validateFiles(incoming, existing, {
      multiple: true,
      maxFiles: 3,
    });
    expect(result.accepted.map((file) => file.name)).toEqual(['c']);
    expect(result.rejected).toEqual([
      { file: incoming[1], code: 'too-many-files' },
      { file: incoming[2], code: 'too-many-files' },
    ]);
    expect(
      validateFiles([makeFile('f', 1)], existing, {
        multiple: true,
        maxFiles: 2,
      }).rejected[0]?.code,
    ).toBe('too-many-files');
  });

  it('does not count invalid files against the cap', () => {
    const bad = makeFile('x.txt', 1, 'text/plain');
    const good = makeFile('a.png', 1, 'image/png');
    const result = validateFiles([bad, good], [], {
      multiple: true,
      maxFiles: 1,
      accept: 'image/*',
    });
    expect(result.accepted).toEqual([good]);
    expect(result.rejected).toEqual([{ file: bad, code: 'file-invalid-type' }]);
  });

  it('replaces the current file in single mode and rejects the extras', () => {
    const current = makeFile('old.png', 1, 'image/png');
    const a = makeFile('a.png', 1, 'image/png');
    const b = makeFile('b.png', 1, 'image/png');
    const result = validateFiles([a, b], [current], { multiple: false });
    expect(result.files).toEqual([a]);
    expect(result.rejected).toEqual([{ file: b, code: 'too-many-files' }]);
  });

  it('keeps the current file in single mode when the new one is invalid', () => {
    const current = makeFile('old.png', 1, 'image/png');
    const bad = makeFile('x.txt', 1, 'text/plain');
    const result = validateFiles([bad], [current], { accept: 'image/*' });
    expect(result.files).toEqual([current]);
    expect(result.rejected[0]?.code).toBe('file-invalid-type');
  });

  it('allows re-picking the same file in single mode', () => {
    const current = makeFile('a.png', 1, 'image/png');
    const result = validateFiles([makeFile('a.png', 1, 'image/png')], [current], {});
    expect(result.rejected).toEqual([]);
    expect(result.accepted).toHaveLength(1);
  });

  it('returns existing files untouched for an empty batch', () => {
    const existing = [makeFile('a', 1)];
    expect(validateFiles([], existing, { multiple: true })).toEqual({
      files: existing,
      accepted: [],
      rejected: [],
    });
  });
});

describe('formatFileSize', () => {
  it('uses 1024-based units named by Intl', () => {
    expect(formatFileSize(0)).toBe('0 byte');
    expect(formatFileSize(512)).toBe('512 byte');
    expect(formatFileSize(1024)).toBe('1 kB');
    expect(formatFileSize(1536)).toBe('1.5 kB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatFileSize(2.5 * 1024 ** 3)).toBe('2.5 GB');
    expect(formatFileSize(3 * 1024 ** 4)).toBe('3,072 GB');
  });

  it('uses Latin digits in Arabic by default and Arabic-Indic on request', () => {
    const latin = formatFileSize(1536, { locale: 'ar' });
    expect(latin).toContain('1.5');
    expect(ARABIC_INDIC.test(latin)).toBe(false);
    expect(latin).toContain('كيلوبايت');
    const indic = formatFileSize(1536, { locale: 'ar', numerals: 'locale' });
    expect(ARABIC_INDIC.test(indic)).toBe(true);
  });
});
