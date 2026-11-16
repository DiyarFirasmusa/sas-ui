import { describe, expect, it } from 'vitest';
import {
  addCalendarMonths,
  addCalendarYears,
  calendarMonthLength,
  calendarMonthStart,
  endOfCalendarMonth,
  formatCalendarDate,
  formatCalendarDateLong,
  formatCalendarDateRange,
  formatCalendarDay,
  formatCalendarMonthYear,
  formatCalendarYear,
  getCalendarMonthGrid,
  getCalendarMonthNames,
  getCalendarYearMonths,
  getCalendarYearRange,
  requireISODate,
  startOfCalendarMonth,
  toCalendarDate,
  toCalendarParts,
  type CalendarSystem,
} from '@/lib/calendar-systems';
import { addDays, toISODate } from '@/lib/date-utils';

const HIJRI: CalendarSystem[] = ['islamic-umalqura', 'islamic-civil'];
const ARABIC_INDIC = /[٠-٩]/;

/** The first days of Hijri months as ICU's Umm al-Qura table prints them. */
const UMALQURA_ANCHORS = [
  { iso: '2026-02-18', year: 1447, month: 9, day: 1, name: 'رمضان' }, // 1 Ramadan 1447
  { iso: '2026-03-20', year: 1447, month: 10, day: 1, name: 'شوال' }, // 1 Shawwal 1447
  { iso: '2026-06-16', year: 1448, month: 1, day: 1, name: 'محرم' }, // 1 Muharram 1448
  { iso: '2027-02-08', year: 1448, month: 9, day: 1, name: 'رمضان' }, // 1 Ramadan 1448
] as const;

/** Independent day-by-day reading of Intl, to compare the lib against. */
function reference(iso: string, system: CalendarSystem) {
  const [year, month, day] = iso.split('-').map(Number);
  const instant = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 12));
  const parts = new Intl.DateTimeFormat(`en-US-u-ca-${system}-nu-latn`, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(instant);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

describe('toCalendarDate', () => {
  it('reads Gregorian parts straight from the ISO string', () => {
    expect(toCalendarDate('2026-11-16', 'gregory')).toEqual({ year: 2026, month: 11, day: 16 });
    expect(toCalendarDate('0099-01-05', 'gregory')).toEqual({ year: 99, month: 1, day: 5 });
  });

  it.each(UMALQURA_ANCHORS)('knows $iso is $day/$month/$year (Umm al-Qura)', (anchor) => {
    expect(toCalendarDate(anchor.iso, 'islamic-umalqura')).toEqual({
      year: anchor.year,
      month: anchor.month,
      day: anchor.day,
    });
  });

  it('prints the 6 Jumada II 1448 example for 16 November 2026', () => {
    expect(toCalendarDate('2026-11-16', 'islamic-umalqura')).toEqual({
      year: 1448,
      month: 6,
      day: 6,
    });
  });

  it('differs by a day between the Umm al-Qura table and the arithmetic civil calendar', () => {
    // Umm al-Qura is table-based; islamic-civil is arithmetic, so they can disagree.
    expect(toCalendarDate('2026-06-16', 'islamic-umalqura').day).toBe(1);
    expect(toCalendarDate('2026-06-16', 'islamic-civil')).toEqual({
      year: 1447,
      month: 12,
      day: 30,
    });
    expect(toCalendarDate('2026-06-17', 'islamic-civil')).toEqual({ year: 1448, month: 1, day: 1 });
  });

  it.each(HIJRI)('matches Intl on every day of 2026-2027 (%s)', (system) => {
    let date = requireISODate('2026-01-01');
    for (let index = 0; index < 730; index += 1) {
      const iso = toISODate(date);
      expect(toCalendarDate(iso, system), iso).toEqual(reference(iso, system));
      date = addDays(date, 1);
    }
  });

  it('rejects an invalid ISO day instead of guessing', () => {
    expect(() => toCalendarDate('2026-02-30', 'islamic-umalqura')).toThrow(RangeError);
    expect(() => toCalendarDate('nonsense', 'gregory')).toThrow(RangeError);
  });
});

describe('toCalendarParts', () => {
  it('returns Arabic month name and era for Hijri', () => {
    expect(toCalendarParts('2026-11-16', 'islamic-umalqura', { locale: 'ar' })).toEqual({
      year: 1448,
      month: 6,
      day: 6,
      monthName: 'جمادى الآخرة',
      eraLabel: 'هـ',
    });
  });

  it('returns English month name and era for Hijri', () => {
    const parts = toCalendarParts('2026-06-16', 'islamic-umalqura', { locale: 'en' });
    expect(parts).toMatchObject({ monthName: 'Muharram', eraLabel: 'AH', year: 1448, day: 1 });
  });

  it.each(UMALQURA_ANCHORS)('names month $month as $name in Arabic', (anchor) => {
    expect(toCalendarParts(anchor.iso, 'islamic-umalqura', { locale: 'ar' }).monthName).toBe(
      anchor.name,
    );
  });

  it('names Gregorian months in both languages', () => {
    expect(toCalendarParts('2026-11-16', 'gregory', { locale: 'ar' })).toMatchObject({
      monthName: 'تشرين الثاني',
      eraLabel: 'م',
      year: 2026,
    });
    expect(toCalendarParts('2026-11-16', 'gregory', { locale: 'en' })).toMatchObject({
      monthName: 'November',
      eraLabel: 'AD',
    });
  });

  it('keeps the numeric parts Latin even when the locale uses Arabic-Indic digits', () => {
    const parts = toCalendarParts('2026-11-16', 'islamic-umalqura', {
      locale: 'ar',
      numerals: 'locale',
    });
    expect(parts.year).toBe(1448);
    expect(parts.day).toBe(6);
  });
});

describe('month bounds', () => {
  it.each(HIJRI)('finds the first and last day of a Hijri month (%s)', (system) => {
    const first = startOfCalendarMonth('2026-11-16', system);
    const last = endOfCalendarMonth('2026-11-16', system);
    expect(toCalendarDate(first, system).day).toBe(1);
    expect(toCalendarDate(first, system).month).toBe(6);
    expect(toCalendarDate(last, system).month).toBe(6);
    // The day after the last day is the 1st of the next month.
    const next = toCalendarDate(toISODate(addDays(requireISODate(last), 1)), system);
    expect(next).toMatchObject({ month: 7, day: 1, year: 1448 });
  });

  it('locates Umm al-Qura months to the day', () => {
    expect(startOfCalendarMonth('2026-11-16', 'islamic-umalqura')).toBe('2026-11-11');
    expect(endOfCalendarMonth('2026-11-16', 'islamic-umalqura')).toBe('2026-12-09');
    expect(startOfCalendarMonth('2026-11-16', 'islamic-civil')).toBe('2026-11-12');
  });

  it('is idempotent on the first and last day of the month', () => {
    expect(startOfCalendarMonth('2026-11-11', 'islamic-umalqura')).toBe('2026-11-11');
    expect(startOfCalendarMonth('2026-12-09', 'islamic-umalqura')).toBe('2026-11-11');
    expect(endOfCalendarMonth('2026-12-09', 'islamic-umalqura')).toBe('2026-12-09');
  });

  it.each(HIJRI)('keeps every Hijri month between 29 and 30 days (%s)', (system) => {
    let month = startOfCalendarMonth('2025-01-01', system);
    const seen = new Set<number>();
    for (let index = 0; index < 48; index += 1) {
      const length = calendarMonthLength(month, system);
      expect(length).toBeGreaterThanOrEqual(29);
      expect(length).toBeLessThanOrEqual(30);
      seen.add(length);
      month = toISODate(addDays(requireISODate(month), length));
      expect(toCalendarDate(month, system).day).toBe(1);
    }
    expect(seen).toEqual(new Set([29, 30]));
  });

  it('measures 29-day and 30-day Umm al-Qura months from the table', () => {
    expect(calendarMonthLength('2026-04-20', 'islamic-umalqura')).toBe(30); // Dhu al-Qa'dah 1447
    expect(calendarMonthLength('2026-06-01', 'islamic-umalqura')).toBe(29); // Dhu al-Hijjah 1447
  });

  it('handles Gregorian months including leap February', () => {
    expect(startOfCalendarMonth('2026-11-16', 'gregory')).toBe('2026-11-01');
    expect(endOfCalendarMonth('2026-11-16', 'gregory')).toBe('2026-11-30');
    expect(calendarMonthLength('2028-02-10', 'gregory')).toBe(29);
    expect(calendarMonthLength('2026-02-10', 'gregory')).toBe(28);
  });
});

describe('calendarMonthStart', () => {
  it('returns the first day of any month from any reference', () => {
    expect(calendarMonthStart('islamic-umalqura', 1448, 1)).toBe('2026-06-16');
    expect(calendarMonthStart('islamic-umalqura', 1447, 9, '2030-05-05')).toBe('2026-02-18');
    expect(calendarMonthStart('islamic-civil', 1448, 1, '2026-06-17')).toBe('2026-06-17');
    expect(calendarMonthStart('gregory', 2026, 11)).toBe('2026-11-01');
  });

  it('lists twelve increasing month starts for a year', () => {
    const starts = getCalendarYearMonths('islamic-umalqura', 1448);
    expect(starts).toHaveLength(12);
    expect(starts[0]).toBe('2026-06-16');
    expect(starts[8]).toBe('2027-02-08'); // Ramadan
    expect([...starts].sort()).toEqual(starts);
    expect(getCalendarYearMonths('gregory', 2026)[10]).toBe('2026-11-01');
  });
});

describe('addCalendarMonths and addCalendarYears', () => {
  it('moves by Hijri months, keeping the day', () => {
    expect(
      toCalendarDate(addCalendarMonths('2026-11-16', 1, 'islamic-umalqura'), 'islamic-umalqura'),
    ).toEqual({
      year: 1448,
      month: 7,
      day: 6,
    });
    expect(
      toCalendarDate(addCalendarMonths('2026-11-16', -6, 'islamic-umalqura'), 'islamic-umalqura'),
    ).toEqual({
      year: 1447,
      month: 12,
      day: 6,
    });
    expect(addCalendarMonths('2026-11-16', 0, 'islamic-umalqura')).toBe('2026-11-16');
  });

  it('crosses Hijri year boundaries in both directions', () => {
    const forward = addCalendarMonths('2026-06-16', 12, 'islamic-umalqura');
    expect(toCalendarDate(forward, 'islamic-umalqura')).toEqual({ year: 1449, month: 1, day: 1 });
    const back = addCalendarMonths('2026-06-16', -1, 'islamic-umalqura');
    expect(toCalendarDate(back, 'islamic-umalqura')).toEqual({ year: 1447, month: 12, day: 1 });
  });

  it('clamps day 30 into a 29-day month', () => {
    // Dhu al-Qa'dah 1447 has 30 days (2026-04-18 .. 05-17); Dhu al-Hijjah 1447 has 29.
    const thirtieth = '2026-05-17';
    expect(toCalendarDate(thirtieth, 'islamic-umalqura')).toMatchObject({ month: 11, day: 30 });
    const moved = addCalendarMonths(thirtieth, 1, 'islamic-umalqura');
    expect(toCalendarDate(moved, 'islamic-umalqura')).toEqual({ year: 1447, month: 12, day: 29 });
    expect(moved).toBe('2026-06-15');
  });

  it('moves by years', () => {
    const next = addCalendarYears('2026-11-16', 1, 'islamic-umalqura');
    expect(toCalendarDate(next, 'islamic-umalqura')).toEqual({ year: 1449, month: 6, day: 6 });
    expect(addCalendarYears('2028-02-29', 1, 'gregory')).toBe('2029-02-28');
    expect(addCalendarMonths('2026-01-31', 1, 'gregory')).toBe('2026-02-28');
  });

  it.each(HIJRI)('round-trips months and years over several years (%s)', (system) => {
    const starts = ['2024-03-11', '2026-02-18', '2026-11-16', '2028-09-30'];
    for (const iso of starts) {
      const origin = toCalendarDate(iso, system);
      for (const amount of [1, 5, 11, 12, 13, 30, 60]) {
        const forward = addCalendarMonths(iso, amount, system);
        const moved = toCalendarDate(forward, system);
        const total = origin.year * 12 + origin.month - 1 + amount;
        expect(moved.year * 12 + moved.month - 1, `${iso} +${amount}`).toBe(total);
        expect(moved.day).toBeLessThanOrEqual(origin.day);
        // Month starts round-trip exactly.
        const start = startOfCalendarMonth(iso, system);
        expect(addCalendarMonths(addCalendarMonths(start, amount, system), -amount, system)).toBe(
          start,
        );
      }
      const yearsLater = addCalendarYears(iso, 3, system);
      expect(toCalendarDate(yearsLater, system).year).toBe(origin.year + 3);
      expect(toCalendarDate(yearsLater, system).month).toBe(origin.month);
    }
  });

  it('matches Intl for far-away months (searching from a distant reference)', () => {
    const start = calendarMonthStart('islamic-umalqura', 1500, 3, '2026-01-01');
    expect(toCalendarDate(start, 'islamic-umalqura')).toEqual({ year: 1500, month: 3, day: 1 });
    const early = calendarMonthStart('islamic-civil', 1300, 12);
    expect(toCalendarDate(early, 'islamic-civil')).toEqual({ year: 1300, month: 12, day: 1 });
  });
});

describe('getCalendarMonthGrid', () => {
  it('lays Muharram 1448 out in weeks starting on Saturday', () => {
    // 1 Muharram 1448 is Tuesday 16 June 2026 (Umm al-Qura), a 30-day month.
    const grid = getCalendarMonthGrid('2026-06-20', 'islamic-umalqura', 6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    // Saturday-first: Sat, Sun, Mon blanks, then Tuesday is the 4th column.
    expect(grid[0]).toEqual([
      null,
      null,
      null,
      '2026-06-16',
      '2026-06-17',
      '2026-06-18',
      '2026-06-19',
    ]);
    const days = grid.flat().filter((cell): cell is string => cell !== null);
    expect(days).toHaveLength(calendarMonthLength('2026-06-16', 'islamic-umalqura'));
    expect(days[0]).toBe('2026-06-16');
    expect(days[days.length - 1]).toBe(endOfCalendarMonth('2026-06-16', 'islamic-umalqura'));
  });

  it('respects weekStartsOn and fixedWeeks', () => {
    const sunday = getCalendarMonthGrid('2026-06-16', 'islamic-umalqura', 0);
    expect(sunday[0]?.slice(0, 3)).toEqual([null, null, '2026-06-16']);
    expect(getCalendarMonthGrid('2026-02-10', 'gregory', 0)).toHaveLength(4);
    expect(getCalendarMonthGrid('2026-02-10', 'gregory', 0, true)).toHaveLength(6);
    expect(getCalendarMonthGrid('2026-06-16', 'islamic-umalqura', 0, true)).toHaveLength(6);
  });

  it('matches the Gregorian grid of date-utils for gregory', () => {
    const grid = getCalendarMonthGrid('2026-11-16', 'gregory', 6);
    expect(grid.flat().filter(Boolean)).toHaveLength(30);
    expect(grid[0]?.[0]).toBeNull();
    expect(grid[0]?.[1]).toBe('2026-11-01'); // Sunday after a Saturday start
  });
});

describe('formatting', () => {
  it('formats a Hijri date in Arabic with Latin digits by default', () => {
    const text = formatCalendarDate('2026-11-16', 'islamic-umalqura', { locale: 'ar' });
    expect(text).toBe('6 جمادى الآخرة 1448 هـ');
    expect(ARABIC_INDIC.test(text)).toBe(false);
  });

  it('formats a Hijri date in English', () => {
    expect(formatCalendarDate('2026-11-16', 'islamic-umalqura', { locale: 'en' })).toBe(
      'Jumada II 6, 1448 AH',
    );
  });

  it('uses the locale digits on request', () => {
    expect(
      formatCalendarDate('2026-11-16', 'islamic-umalqura', { locale: 'ar', numerals: 'locale' }),
    ).toBe('٦ جمادى الآخرة ١٤٤٨ هـ');
    expect(
      formatCalendarDay('2026-11-16', 'islamic-umalqura', { locale: 'ar', numerals: 'locale' }),
    ).toBe('٦');
    expect(formatCalendarDay('2026-11-16', 'islamic-umalqura', { locale: 'ar' })).toBe('6');
  });

  it('matches the Gregorian output of Intl for gregory', () => {
    expect(formatCalendarDate('2026-11-16', 'gregory', { locale: 'en' })).toBe('November 16, 2026');
    expect(formatCalendarDate('2026-11-16', 'gregory', { locale: 'ar' })).toBe(
      '16 تشرين الثاني 2026',
    );
    expect(formatCalendarDate('2026-03-05', 'gregory', { locale: 'en', dateStyle: 'medium' })).toBe(
      'Mar 5, 2026',
    );
    expect(formatCalendarMonthYear('2026-11-16', 'gregory', { locale: 'en' })).toBe(
      'November 2026',
    );
    expect(formatCalendarDateLong('2026-11-16', 'gregory', { locale: 'en' })).toBe(
      'Monday, November 16, 2026',
    );
  });

  it('formats captions and long names for Hijri', () => {
    expect(formatCalendarMonthYear('2026-11-16', 'islamic-umalqura', { locale: 'ar' })).toBe(
      'جمادى الآخرة 1448 هـ',
    );
    expect(formatCalendarDateLong('2026-11-16', 'islamic-umalqura', { locale: 'ar' })).toBe(
      'الاثنين، 6 جمادى الآخرة 1448 هـ',
    );
    expect(formatCalendarDay('2026-11-16', 'gregory')).toBe('16');
  });

  it('formats a range and collapses equal ends', () => {
    const range = formatCalendarDateRange('2026-11-10', '2026-11-20', 'islamic-umalqura', {
      locale: 'ar',
    });
    expect(range).toBe('30 جمادى الأولى – 10 جمادى الآخرة 1448 هـ');
    expect(
      formatCalendarDateRange('2026-11-16', '2026-11-16', 'islamic-umalqura', { locale: 'en' }),
    ).toBe('Jumada II 6, 1448 AH');
    // Intl separates the dash with thin spaces; match any whitespace.
    expect(
      formatCalendarDateRange('2026-11-20', '2026-11-10', 'gregory', { locale: 'en' }),
    ).toMatch(/^November 10\s–\s20, 2026$/);
  });

  it('formats years with Latin or locale digits and no grouping', () => {
    expect(formatCalendarYear(1448, { locale: 'ar' })).toBe('1448');
    expect(formatCalendarYear(1448, { locale: 'ar', numerals: 'locale' })).toBe('١٤٤٨');
    expect(formatCalendarYear(2026, { locale: 'en' })).toBe('2026');
  });

  it('does not drift across the day in a time zone far from UTC', () => {
    // Formatting uses UTC noon, so the host zone cannot move the day.
    expect(formatCalendarDay('2026-06-16', 'islamic-umalqura')).toBe('1');
    expect(formatCalendarDay('2026-01-01', 'gregory')).toBe('1');
  });
});

describe('dropdown lists', () => {
  it('lists the twelve Hijri month names in Arabic and English', () => {
    const arabic = getCalendarMonthNames('islamic-umalqura', { locale: 'ar' });
    expect(arabic.map((entry) => entry.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(arabic[0]?.name).toBe('محرم');
    expect(arabic[8]?.name).toBe('رمضان');
    expect(arabic[11]?.name).toBe('ذو الحجة');
    const english = getCalendarMonthNames('islamic-umalqura', { locale: 'en' });
    expect(english[0]?.name).toBe('Muharram');
    expect(english[8]?.name).toBe('Ramadan');
    expect(new Set(english.map((entry) => entry.name)).size).toBe(12);
  });

  it('lists Gregorian month names', () => {
    expect(getCalendarMonthNames('gregory', { locale: 'en' }).map((entry) => entry.name)).toEqual([
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
    expect(getCalendarMonthNames('gregory', { locale: 'ar' })[10]?.name).toBe('تشرين الثاني');
  });

  it('builds a year range around a day, or between bounds', () => {
    const around = getCalendarYearRange('islamic-umalqura', { around: '2026-11-16' });
    expect(around[0]).toEqual({ year: 1348, label: '1348' });
    expect(around[around.length - 1]).toEqual({ year: 1548, label: '1548' });
    expect(around).toHaveLength(201);

    const bounded = getCalendarYearRange('islamic-umalqura', {
      around: '2026-11-16',
      from: '2024-01-01',
      to: '2030-12-31',
    });
    expect(bounded.map((entry) => entry.year)).toEqual([
      1445, 1446, 1447, 1448, 1449, 1450, 1451, 1452,
    ]);
  });

  it('always includes the viewed year, even outside the bounds', () => {
    const years = getCalendarYearRange('gregory', {
      around: '2026-11-16',
      from: '2027-01-01',
      to: '2028-01-01',
    });
    expect(years.map((entry) => entry.year)).toEqual([2026, 2027, 2028]);
  });

  it('labels years with Arabic-Indic digits on request and never goes below year 1', () => {
    const years = getCalendarYearRange('gregory', {
      around: '0010-05-05',
      locale: 'ar',
      numerals: 'locale',
      span: 20,
    });
    expect(years[0]).toEqual({ year: 1, label: '١' });
    expect(getCalendarYearRange('gregory', { around: '2026-01-01', span: 2 })).toHaveLength(5);
  });
});
