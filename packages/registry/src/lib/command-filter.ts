/** Scores how well an item matches the search: 0 hides it, higher is better. */
export type CommandFilter = (value: string, search: string, keywords: string[]) => number;

/**
 * Latin accents, Arabic diacritics and tatweel are noise when searching; the
 * alef and ya variants are spelled interchangeably, so they compare equal.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')
    .replace(/\u0649/g, '\u064a')
    .toLowerCase()
    .trim();
}

/** Every word of the search must appear in the value or keywords; prefix matches rank first. */
export const defaultCommandFilter: CommandFilter = (value, search, keywords) => {
  const terms = normalizeSearchText(search).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return 1;
  }
  const label = normalizeSearchText(value);
  const haystack = [label, ...keywords.map(normalizeSearchText)].join(' ');
  if (!terms.every((term) => haystack.includes(term))) {
    return 0;
  }
  return label.startsWith(terms[0] ?? '') ? 1 : 0.5;
};
