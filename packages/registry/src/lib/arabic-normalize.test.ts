import { describe, expect, it } from 'vitest';
import { matchesText, normalizeArabic, toLatinDigits } from '@/lib/arabic-normalize';

describe('normalizeArabic', () => {
  it('strips tashkeel, superscript alef and tatweel', () => {
    expect(normalizeArabic('مُحَمَّد')).toBe('محمد');
    expect(normalizeArabic('الرَّحْمٰن')).toBe('الرحمن');
    expect(normalizeArabic('كـتـــاب')).toBe('كتاب');
  });

  it('folds every alef variant to a bare alef', () => {
    expect(normalizeArabic('أ إ آ ٱ ا')).toBe('ا ا ا ا ا');
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'));
    expect(normalizeArabic('إسلام')).toBe(normalizeArabic('اسلام'));
    expect(normalizeArabic('آمنة')).toBe('امنة');
  });

  it('composes an alef typed with a separate hamza mark', () => {
    expect(normalizeArabic('أحمد')).toBe('احمد');
  });

  it('folds alef maksura to ya', () => {
    expect(normalizeArabic('مصطفى')).toBe('مصطفي');
  });

  it('folds Persian and Kurdish letter forms by default and can keep them', () => {
    expect(normalizeArabic('کتاب')).toBe('كتاب');
    expect(normalizeArabic('عراقی')).toBe('عراقي');
    expect(normalizeArabic('کتاب', { foldPersianLetters: false })).toBe('کتاب');
  });

  it('keeps taa marbuta and hamza carriers unless asked to fold them', () => {
    expect(normalizeArabic('مدرسة')).toBe('مدرسة');
    expect(normalizeArabic('سؤال')).toBe('سؤال');
    expect(normalizeArabic('شيء')).toBe('شيء');
    expect(normalizeArabic('رئيس')).toBe('رئيس');
  });

  it('folds taa marbuta to ha when asked', () => {
    expect(normalizeArabic('مدرسة', { foldTaMarbuta: true })).toBe('مدرسه');
    expect(normalizeArabic('مدرسة', { foldTaMarbuta: true })).toBe(
      normalizeArabic('مدرسه', { foldTaMarbuta: true }),
    );
  });

  it('folds hamza carriers when asked, and nothing else', () => {
    expect(normalizeArabic('سؤال', { foldHamzaCarriers: true })).toBe('سوال');
    expect(normalizeArabic('رئيس', { foldHamzaCarriers: true })).toBe('رييس');
    expect(normalizeArabic('شيء', { foldHamzaCarriers: true })).toBe('شي');
    expect(normalizeArabic('مدرسة', { foldHamzaCarriers: true })).toBe('مدرسة');
  });

  it('turns Arabic-Indic and Extended Arabic-Indic digits into Latin digits', () => {
    expect(normalizeArabic('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(normalizeArabic('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(normalizeArabic('فاتورة ١٢٣ و 45')).toBe('فاتورة 123 و 45');
  });

  it('maps the Arabic decimal and thousands separators', () => {
    expect(normalizeArabic('١٬٢٣٤٫٥')).toBe('1,234.5');
  });

  it('lowercases Latin and strips its accents', () => {
    expect(normalizeArabic('  Café Münster ÀÉÎ ')).toBe('cafe munster aei');
    expect(normalizeArabic('Ångström')).toBe('angstrom');
  });

  it('strips accents typed as separate combining marks', () => {
    expect(normalizeArabic('Café')).toBe('cafe');
    expect(normalizeArabic('x́')).toBe('x');
  });

  it('collapses whitespace and removes zero-width and bidi marks', () => {
    expect(normalizeArabic('  علي \n\t  حسن  ')).toBe('علي حسن');
    expect(normalizeArabic('‏علي‎​ حسن﻿')).toBe('علي حسن');
    expect(normalizeArabic('a b')).toBe('a b');
  });

  it('folds presentation forms and full-width characters', () => {
    expect(normalizeArabic('ﻻ')).toBe('لا');
    expect(normalizeArabic('ﷲ')).toBe('الله');
    expect(normalizeArabic('ＡＢＣ１２')).toBe('abc12');
  });

  it('handles mixed Arabic and Latin text', () => {
    expect(normalizeArabic('شركة Äcme رقم ٧')).toBe('شركة acme رقم 7');
  });

  it('returns an empty string for empty or blank input', () => {
    expect(normalizeArabic('')).toBe('');
    expect(normalizeArabic(' ​ ')).toBe('');
  });

  it('is idempotent', () => {
    const samples = ['مُحَمَّد أحمد ٣', 'Café  Müller', 'سؤال ئ ة', ''];
    for (const sample of samples) {
      const once = normalizeArabic(sample, { foldTaMarbuta: true, foldHamzaCarriers: true });
      expect(normalizeArabic(once, { foldTaMarbuta: true, foldHamzaCarriers: true })).toBe(once);
    }
  });
});

describe('toLatinDigits', () => {
  it('only touches digits and the two Arabic separators', () => {
    expect(toLatinDigits('رقم ٣٫١٤ و ۵۶')).toBe('رقم 3.14 و 56');
    expect(toLatinDigits('Åbc')).toBe('Åbc');
  });
});

describe('matchesText', () => {
  it('contains ignores diacritics, alef forms and digit styles', () => {
    expect(matchesText('مُحَمَّد أحمد', 'احمد', 'contains')).toBe(true);
    expect(matchesText('فاتورة رقم ١٢٣', 'رقم 123', 'contains')).toBe(true);
    expect(matchesText('Invoice 123', 'invoice ١٢٣', 'contains')).toBe(true);
    expect(matchesText('مصطفى', 'مصطفي', 'contains')).toBe(true);
    expect(matchesText('أحمد', 'علي', 'contains')).toBe(false);
  });

  it('defaults to contains', () => {
    expect(matchesText('Café', 'caf')).toBe(true);
  });

  it('startsWith compares the normalised beginning', () => {
    expect(matchesText('إبراهيم', 'ابر', 'startsWith')).toBe(true);
    expect(matchesText('إبراهيم', 'راهيم', 'startsWith')).toBe(false);
    expect(matchesText('  Élan', 'el', 'startsWith')).toBe(true);
  });

  it('equals needs the whole normalised text to match', () => {
    expect(matchesText('أحمد', 'احمد', 'equals')).toBe(true);
    expect(matchesText('أحمد علي', 'احمد', 'equals')).toBe(false);
    expect(matchesText('١٢٣', '123', 'equals')).toBe(true);
  });

  it('treats an empty needle as match-all for contains and startsWith', () => {
    expect(matchesText('abc', '', 'contains')).toBe(true);
    expect(matchesText('abc', '  ', 'startsWith')).toBe(true);
    expect(matchesText('abc', '', 'equals')).toBe(false);
    expect(matchesText('', '', 'equals')).toBe(true);
  });

  it('passes the folding options through to both sides', () => {
    expect(matchesText('مدرسة', 'مدرسه', 'equals')).toBe(false);
    expect(matchesText('مدرسة', 'مدرسه', 'equals', { foldTaMarbuta: true })).toBe(true);
    expect(matchesText('سؤال', 'سوال', 'contains', { foldHamzaCarriers: true })).toBe(true);
  });
});
