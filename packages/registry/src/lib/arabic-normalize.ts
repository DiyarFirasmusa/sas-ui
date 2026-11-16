export interface NormalizeArabicOptions {
  /**
   * Fold ة (taa marbuta) into ه. Lossy: "مدرسة" (school) and "مدرسه" compare
   * equal, but so do unrelated pairs, so it is off unless users type
   * the two interchangeably (common in dialect and on mobile keyboards).
   */
  foldTaMarbuta?: boolean;
  /**
   * Fold the hamza carriers ؤ → و and ئ → ي, and drop a stand-alone ء. Lossy
   * for the same reason: "سؤال" and "سوال" become one word. Off by default.
   */
  foldHamzaCarriers?: boolean;
  /**
   * Fold the Persian/Kurdish forms ی → ي and ک → ك, which Kurdish and Persian
   * keyboards type in place of the Arabic letters. Default on: the two forms
   * never distinguish words inside one language.
   */
  foldPersianLetters?: boolean;
}

export type TextMatchMode = 'contains' | 'startsWith' | 'equals';

// Honorific signs, harakat, superscript alef and Quranic annotation marks.
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭ]/g;
// Zero-width and bidi control characters pasted in from other documents.
const INVISIBLE = /[؜​-‏‪-‮⁦-⁩﻿]/g;
const LATIN_CHUNK = /[À-ɏḀ-ỿ]+/g;
const LEFTOVER_COMBINING = /[̀-ͯ]/g;
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/g;

/** Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits as Latin 0-9, and ٫ ٬ as . , */
export function toLatinDigits(text: string): string {
  return text
    .replace(ARABIC_INDIC_DIGITS, (digit) => {
      const code = digit.charCodeAt(0);
      return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
    })
    .replace(/٫/g, '.')
    .replace(/٬/g, ',');
}

/**
 * Text prepared for comparison, so Arabic search ignores spelling noise:
 * - tashkeel (harakat) and tatweel are removed;
 * - alef variants أ إ آ ٱ become ا, and ى becomes ي;
 * - Arabic-Indic and Extended Arabic-Indic digits become Latin digits;
 * - Latin is lower-cased and loses its accents;
 * - whitespace (and zero-width / bidi marks) is collapsed and trimmed.
 *
 * Presentation forms (ﻻ, ﷲ) and full-width characters are folded by NFKC
 * first. ة and the hamza carriers are only folded on request because that
 * merges unrelated words; see {@link NormalizeArabicOptions}.
 *
 * Both sides of a comparison must go through the same options.
 */
export function normalizeArabic(text: string, options: NormalizeArabicOptions = {}): string {
  const { foldTaMarbuta = false, foldHamzaCarriers = false, foldPersianLetters = true } = options;
  // NFKC, not NFKD: decomposing would split ؤ and ئ into base + hamza mark and
  // fold them unconditionally. NFKC also recomposes "ا + hamza mark" typed as two characters.
  let result = toLatinDigits(text.normalize('NFKC').replace(INVISIBLE, ''))
    .replace(ARABIC_MARKS, '')
    .replace(/ـ/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي');
  if (foldPersianLetters) {
    result = result.replace(/ی/g, 'ي').replace(/ک/g, 'ك');
  }
  if (foldTaMarbuta) {
    result = result.replace(/ة/g, 'ه');
  }
  if (foldHamzaCarriers) {
    result = result.replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '');
  }
  return result
    .replace(LATIN_CHUNK, (chunk) => chunk.normalize('NFD'))
    .replace(LEFTOVER_COMBINING, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whether `haystack` matches `needle` once both are normalised. An empty
 * needle matches everything for `contains` and `startsWith`, and only empty
 * text for `equals`.
 */
export function matchesText(
  haystack: string,
  needle: string,
  mode: TextMatchMode = 'contains',
  options: NormalizeArabicOptions = {},
): boolean {
  const text = normalizeArabic(haystack, options);
  const query = normalizeArabic(needle, options);
  switch (mode) {
    case 'contains':
      return text.includes(query);
    case 'startsWith':
      return text.startsWith(query);
    case 'equals':
      return text === query;
  }
}
