import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDays,
  createDate,
  daysInMonth,
  defaultWeekStartsOn,
  differenceInDays,
  endOfMonth,
  endOfWeek,
  formatDate,
  formatDateLong,
  formatDateRange,
  formatDayNumber,
  formatMonthYear,
  formatTime,
  getDayPeriodLabels,
  getMonthGrid,
  getWeekdays,
  isOutOfBounds,
  isSameDay,
  isSameMonth,
  isValidISODate,
  isWithinRange,
  nextRange,
  parseISODate,
  parseTime,
  resolveIntlLocale,
  startOfDay,
  startOfMonth,
  startOfWeek,
  stepToMultiple,
  stepWithin,
  to12Hour,
  to24Hour,
  toISODate,
} from '@/lib/date-utils';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

describe('ISO parsing and formatting', () => {
  it('round-trips local dates without timezone drift', () => {
    const date = parseISODate('2026-11-16');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(16);
    expect(date?.getHours()).toBe(0);
    expect(toISODate(createDate(2026, 0, 1))).toBe('2026-01-01');
    expect(toISODate(createDate(2026, 11, 31))).toBe('2026-12-31');
  });

  it('keeps midnight dates stable around daylight saving changes', () => {
    for (const iso of ['2026-03-08', '2026-03-29', '2026-10-25', '2026-11-01']) {
      const date = parseISODate(iso);
      expect(date && toISODate(date)).toBe(iso);
      expect(date && differenceInDays(date, addDays(date, 1))).toBe(1);
      expect(date && addDays(date, 1).getHours()).toBe(0);
    }
  });

  it('rejects malformed and impossible dates', () => {
    for (const bad of [
      '',
      '2026-1-1',
      '2026/01/01',
      '2026-02-30',
      '2026-13-01',
      '2026-00-10',
      '2025-02-29',
      'abcd-ef-gh',
      '2026-11-16T10:00',
    ]) {
      expect(parseISODate(bad), bad).toBeNull();
    }
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate(undefined)).toBeNull();
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(isValidISODate('2026-02-29')).toBe(false);
  });

  it('handles years below 100 and pads the year', () => {
    const date = parseISODate('0050-06-15');
    expect(date?.getFullYear()).toBe(50);
    expect(date && toISODate(date)).toBe('0050-06-15');
  });
});

describe('arithmetic', () => {
  it('compares and counts days', () => {
    const a = createDate(2026, 2, 1);
    const b = createDate(2026, 2, 8);
    expect(compareDays(a, b)).toBe(-1);
    expect(compareDays(b, a)).toBe(1);
    expect(compareDays(a, new Date(2026, 2, 1, 23, 59))).toBe(0);
    expect(differenceInDays(a, b)).toBe(7);
    expect(differenceInDays(createDate(2026, 2, 28), createDate(2026, 3, 2))).toBe(5);
  });

  it('isSameDay ignores time and tolerates missing dates', () => {
    expect(isSameDay(new Date(2026, 5, 1, 3), new Date(2026, 5, 1, 22))).toBe(true);
    expect(isSameDay(createDate(2026, 5, 1), createDate(2026, 5, 2))).toBe(false);
    expect(isSameDay(null, createDate(2026, 5, 1))).toBe(false);
    expect(isSameMonth(createDate(2026, 5, 1), createDate(2026, 5, 30))).toBe(true);
    expect(isSameMonth(createDate(2026, 5, 1), createDate(2025, 5, 1))).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(toISODate(addDays(createDate(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(toISODate(addDays(createDate(2026, 2, 1), -1))).toBe('2026-02-28');
    expect(toISODate(addDays(createDate(2026, 0, 1), 365))).toBe('2027-01-01');
  });

  it('adds months clamping the day to the target month', () => {
    expect(toISODate(addMonths(createDate(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(toISODate(addMonths(createDate(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(toISODate(addMonths(createDate(2026, 10, 16), 2))).toBe('2027-01-16');
    expect(toISODate(addMonths(createDate(2026, 0, 15), -1))).toBe('2025-12-15');
    expect(toISODate(addMonths(createDate(2026, 0, 15), -13))).toBe('2024-12-15');
    expect(toISODate(addYears(createDate(2024, 1, 29), 1))).toBe('2025-02-28');
  });

  it('finds month boundaries and lengths', () => {
    expect(toISODate(startOfMonth(createDate(2026, 4, 17)))).toBe('2026-05-01');
    expect(toISODate(endOfMonth(createDate(2026, 1, 3)))).toBe('2026-02-28');
    expect(toISODate(endOfMonth(createDate(2024, 1, 3)))).toBe('2024-02-29');
    expect(daysInMonth(2026, 11)).toBe(31);
    expect(toISODate(startOfDay(new Date(2026, 5, 1, 17, 30)))).toBe('2026-06-01');
  });

  it('finds week boundaries for any week start', () => {
    const monday = createDate(2026, 10, 16); // Monday
    expect(monday.getDay()).toBe(1);
    expect(toISODate(startOfWeek(monday, 0))).toBe('2026-11-15');
    expect(toISODate(startOfWeek(monday, 1))).toBe('2026-11-16');
    expect(toISODate(startOfWeek(monday, 6))).toBe('2026-11-14');
    expect(toISODate(endOfWeek(monday, 6))).toBe('2026-11-20');
    expect(toISODate(endOfWeek(createDate(2026, 10, 14), 6))).toBe('2026-11-20');
  });
});

describe('bounds and ranges', () => {
  const min = createDate(2026, 5, 10);
  const max = createDate(2026, 5, 20);

  it('clamps into min/max', () => {
    expect(clampDate(createDate(2026, 5, 1), min, max)).toBe(min);
    expect(clampDate(createDate(2026, 5, 30), min, max)).toBe(max);
    const inside = createDate(2026, 5, 15);
    expect(clampDate(inside, min, max)).toBe(inside);
    expect(clampDate(inside, null, undefined)).toBe(inside);
    expect(clampDate(createDate(2020, 0, 1), min)).toBe(min);
  });

  it('reports out-of-bounds dates', () => {
    expect(isOutOfBounds(createDate(2026, 5, 9), min, max)).toBe(true);
    expect(isOutOfBounds(createDate(2026, 5, 10), min, max)).toBe(false);
    expect(isOutOfBounds(createDate(2026, 5, 20), min, max)).toBe(false);
    expect(isOutOfBounds(createDate(2026, 5, 21), min, max)).toBe(true);
    expect(isOutOfBounds(createDate(2026, 5, 21), min, null)).toBe(false);
  });

  it('tests range containment inclusively and in either order', () => {
    const from = createDate(2026, 5, 10);
    const to = createDate(2026, 5, 14);
    expect(isWithinRange(createDate(2026, 5, 10), from, to)).toBe(true);
    expect(isWithinRange(createDate(2026, 5, 12), from, to)).toBe(true);
    expect(isWithinRange(createDate(2026, 5, 14), from, to)).toBe(true);
    expect(isWithinRange(createDate(2026, 5, 15), from, to)).toBe(false);
    expect(isWithinRange(createDate(2026, 5, 12), to, from)).toBe(true);
    expect(isWithinRange(createDate(2026, 5, 10), from, null)).toBe(true);
    expect(isWithinRange(createDate(2026, 5, 11), from, null)).toBe(false);
    expect(isWithinRange(createDate(2026, 5, 11), null, to)).toBe(false);
  });

  it('builds ranges click by click', () => {
    const d10 = createDate(2026, 5, 10);
    const d14 = createDate(2026, 5, 14);
    const d20 = createDate(2026, 5, 20);
    const started = nextRange({ from: null, to: null }, d14);
    expect(started).toEqual({ from: d14, to: null });
    expect(nextRange(started, d20)).toEqual({ from: d14, to: d20 });
    expect(nextRange(started, d10)).toEqual({ from: d10, to: d14 });
    expect(nextRange(started, d14)).toEqual({ from: d14, to: d14 });
    expect(nextRange({ from: d10, to: d14 }, d20)).toEqual({
      from: d20,
      to: null,
    });
  });
});

describe('getMonthGrid', () => {
  it('lays November 2026 out for a Sunday start', () => {
    const weeks = getMonthGrid(2026, 10, 0);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(toISODate(weeks[0]![0]!)).toBe('2026-11-01'); // Nov 1 2026 is a Sunday
    expect(toISODate(weeks[4]![6]!)).toBe('2026-12-05');
  });

  it('starts on Saturday for Arabic and pads with the previous month', () => {
    const weeks = getMonthGrid(2026, 10, 6);
    expect(weeks[0]![0]!.getDay()).toBe(6);
    expect(toISODate(weeks[0]![0]!)).toBe('2026-10-31');
    expect(toISODate(weeks[0]![1]!)).toBe('2026-11-01');
  });

  it('starts on Monday when asked', () => {
    const weeks = getMonthGrid(2026, 10, 1);
    expect(toISODate(weeks[0]![0]!)).toBe('2026-10-26');
    expect(weeks[0]!.every((day, index) => day.getDay() === (1 + index) % 7)).toBe(true);
  });

  it('uses 4 weeks for a Sunday-aligned February and 6 when fixed', () => {
    expect(getMonthGrid(2026, 1, 0)).toHaveLength(4); // Feb 2026 starts on Sunday, 28 days
    expect(getMonthGrid(2026, 1, 0, true)).toHaveLength(6);
  });

  it('needs 6 weeks when a 31-day month starts late in the week', () => {
    expect(getMonthGrid(2026, 7, 0)).toHaveLength(6); // Aug 2026 starts on Saturday
  });

  it('contains every day of the month exactly once, in order', () => {
    for (const weekStart of [0, 1, 6] as const) {
      const days = getMonthGrid(2024, 1, weekStart).flat();
      const inMonth = days.filter((day) => day.getMonth() === 1);
      expect(inMonth.map((day) => day.getDate())).toEqual(
        Array.from({ length: 29 }, (_, i) => i + 1),
      );
      days.slice(1).forEach((day, index) => {
        expect(differenceInDays(days[index]!, day)).toBe(1);
      });
    }
  });
});

describe('week start defaults', () => {
  it('is Saturday for Arabic and Sunday otherwise', () => {
    expect(defaultWeekStartsOn('ar')).toBe(6);
    expect(defaultWeekStartsOn('ar-IQ')).toBe(6);
    expect(defaultWeekStartsOn('en')).toBe(0);
    expect(defaultWeekStartsOn('en-US')).toBe(0);
  });
});

describe('locale and numerals', () => {
  it('maps bare languages to regional locales and forces Latin digits by default', () => {
    expect(resolveIntlLocale('ar')).toBe('ar-IQ-u-nu-latn');
    expect(resolveIntlLocale('en')).toBe('en-US-u-nu-latn');
    expect(resolveIntlLocale('ar', 'locale')).toBe('ar-IQ-u-nu-arab');
    expect(resolveIntlLocale('en', 'locale')).toBe('en-US');
    expect(resolveIntlLocale('ar-IQ', 'latn')).toBe('ar-IQ-u-nu-latn');
    expect(resolveIntlLocale()).toBe('en-US-u-nu-latn');
  });

  it('formats Arabic dates with Latin digits by default', () => {
    const date = createDate(2026, 10, 16);
    const text = formatDate(date, { locale: 'ar' });
    expect(text).toContain('16');
    expect(text).toContain('2026');
    expect(text).toContain('تشرين الثاني');
    expect(ARABIC_INDIC.test(text)).toBe(false);
  });

  it('uses Arabic-Indic digits only when asked', () => {
    const date = createDate(2026, 10, 16);
    const text = formatDate(date, { locale: 'ar', numerals: 'locale' });
    expect(ARABIC_INDIC.test(text)).toBe(true);
    expect(text).not.toMatch(/\d/);
    expect(formatDayNumber(date, { locale: 'ar', numerals: 'locale' })).toBe('١٦');
    expect(formatDayNumber(date, { locale: 'ar' })).toBe('16');
  });

  it('formats English dates and month titles', () => {
    const date = createDate(2026, 10, 16);
    expect(formatDate(date, { locale: 'en' })).toBe('November 16, 2026');
    expect(formatDate(date, { locale: 'en', dateStyle: 'medium' })).toBe('Nov 16, 2026');
    expect(formatMonthYear(date, { locale: 'en' })).toBe('November 2026');
    expect(formatMonthYear(date, { locale: 'ar' })).toBe('تشرين الثاني 2026');
    expect(formatDateLong(date, { locale: 'en' })).toBe('Monday, November 16, 2026');
    expect(formatDateLong(date, { locale: 'ar' })).toContain('الاثنين');
  });

  it('formats ranges and collapses equal ends', () => {
    const from = createDate(2026, 10, 16);
    const to = createDate(2026, 10, 20);
    expect(formatDateRange(from, to, { locale: 'en', dateStyle: 'medium' })).toMatch(
      /Nov 16\s*[–-]\s*20, 2026/,
    );
    expect(formatDateRange(from, from, { locale: 'en' })).toBe('November 16, 2026');
    expect(formatDateRange(from, null, { locale: 'en' })).toBe('November 16, 2026');
    expect(formatDateRange(to, from, { locale: 'en', dateStyle: 'medium' })).toBe(
      formatDateRange(from, to, { locale: 'en', dateStyle: 'medium' }),
    );
    expect(ARABIC_INDIC.test(formatDateRange(from, to, { locale: 'ar' }))).toBe(false);
  });
});

describe('getWeekdays', () => {
  it('orders names from the week start, taken from Intl', () => {
    const en = getWeekdays(0, { locale: 'en' });
    expect(en.map((day) => day.long)).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(en[0]).toMatchObject({ index: 0, narrow: 'S' });
    const ar = getWeekdays(6, { locale: 'ar' });
    expect(ar[0]).toMatchObject({ index: 6, long: 'السبت' });
    expect(ar[1]?.long).toBe('الأحد');
    expect(ar).toHaveLength(7);
  });

  it('rotates for a Monday start', () => {
    expect(getWeekdays(1, { locale: 'en' }).map((day) => day.index)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe('time helpers', () => {
  it('parses strict HH:mm', () => {
    expect(parseTime('09:05')).toEqual({ hour: 9, minute: 5 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
    for (const bad of ['24:00', '9:05', '12:60', '12:5', '', 'ab:cd', '12:30:00']) {
      expect(parseTime(bad), bad).toBeNull();
    }
    expect(parseTime(null)).toBeNull();
  });

  it('formats HH:mm with padding', () => {
    expect(formatTime({ hour: 7, minute: 3 })).toBe('07:03');
    expect(formatTime({ hour: 18, minute: 45 })).toBe('18:45');
  });

  it('converts between 24h and 12h clocks', () => {
    expect(to12Hour(0)).toEqual({ hour: 12, period: 'am' });
    expect(to12Hour(9)).toEqual({ hour: 9, period: 'am' });
    expect(to12Hour(12)).toEqual({ hour: 12, period: 'pm' });
    expect(to12Hour(15)).toEqual({ hour: 3, period: 'pm' });
    expect(to12Hour(23)).toEqual({ hour: 11, period: 'pm' });
    for (let hour = 0; hour < 24; hour += 1) {
      const { hour: h12, period } = to12Hour(hour);
      expect(to24Hour(h12, period)).toBe(hour);
    }
  });

  it('steps with wrap-around', () => {
    expect(stepWithin(59, 1, 0, 59)).toBe(0);
    expect(stepWithin(0, -1, 0, 59)).toBe(59);
    expect(stepWithin(12, 1, 1, 12)).toBe(1);
    expect(stepWithin(1, -1, 1, 12)).toBe(12);
    expect(stepWithin(50, 15, 0, 59)).toBe(5);
    expect(stepWithin(5, -15, 0, 59)).toBe(50);
  });

  it('steps minutes on a grid, wrapping at both ends', () => {
    expect(stepToMultiple(0, 1, 1)).toBe(1);
    expect(stepToMultiple(59, 1, 1)).toBe(0);
    expect(stepToMultiple(0, -1, 1)).toBe(59);
    expect(stepToMultiple(0, 1, 15)).toBe(15);
    expect(stepToMultiple(45, 1, 15)).toBe(0);
    expect(stepToMultiple(0, -1, 15)).toBe(45);
    expect(stepToMultiple(7, 1, 15)).toBe(15);
    expect(stepToMultiple(7, -1, 15)).toBe(0);
    expect(stepToMultiple(20, -1, 15)).toBe(15);
    expect(stepToMultiple(50, 1, 10)).toBe(0);
  });

  it('reads AM/PM labels from Intl', () => {
    expect(getDayPeriodLabels({ locale: 'en' })).toEqual({
      am: 'AM',
      pm: 'PM',
    });
    expect(getDayPeriodLabels({ locale: 'ar' })).toEqual({ am: 'ص', pm: 'م' });
  });
});
