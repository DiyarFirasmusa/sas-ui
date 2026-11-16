/**
 * Calendar systems for the calendar and date pickers, built on Intl only.
 *
 * The VALUE of every date stays a Gregorian ISO `yyyy-mm-dd` string; a calendar
 * system only changes how a day is read and navigated (day number, month and
 * year, where a month starts and ends). Hijri months are 29 or 30 days and
 * come from the ICU tables, so boundaries are found by scanning with Intl and
 * never from assumed lengths.
 *
 * Notes on accuracy:
 * - `islamic-umalqura` is the Saudi table (the civil calendar of Iraq's Gulf
 *   neighbours) and is table-based: ICU only knows the years it ships tables for.
 * - `islamic-civil` is the arithmetic calendar and can differ by a day from
 *   moon-sighting calendars, as can Umm al-Qura.
 * - Dates before 1 AH are not supported.
 *
 * Every Intl call formats noon UTC with `timeZone: 'UTC'`, so a local day can
 * never drift across midnight or a DST change.
 */
import {
  addDays,
  addMonths,
  addYears,
  createDate,
  daysInMonth,
  parseISODate,
  resolveIntlLocale,
  toISODate,
  type DateFormatOptions,
  type DateStyle,
  type WeekStart,
} from '@/lib/date-utils';

export type CalendarSystem = 'gregory' | 'islamic-umalqura' | 'islamic-civil';

/** Day, month (1-based) and year of an ISO day in a calendar system; always Latin numbers. */
export interface CalendarDate {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
}

export interface CalendarParts extends CalendarDate {
  /** `جمادى الآخرة` / `Jumada II`, in the requested locale. */
  monthName: string;
  /** `هـ` / `AH` for Hijri, `م` / `AD` for Gregorian. */
  eraLabel: string;
}

export interface CalendarMonthName {
  /** 1-12 */
  month: number;
  name: string;
}

export interface CalendarYear {
  year: number;
  /** The year written with the requested digits, no grouping. */
  label: string;
}

// Mean length of a synodic month; only used to estimate where to look, never as a boundary.
const AVERAGE_MONTH_DAYS = 29.530588;
const MAX_MONTH_DAYS = 32;
const MAX_SEARCH_STEPS = 12;
const DEFAULT_REFERENCE = '2000-01-01';
const CACHE_LIMIT = 4000;

// ---------------------------------------------------------------- helpers

/** Strict ISO → local date; throws so a bad value never turns into a silent wrong month. */
export function requireISODate(iso: string): Date {
  const date = parseISODate(iso);
  if (!date) {
    throw new RangeError(`Invalid ISO date: ${iso}`);
  }
  return date;
}

function shiftISO(iso: string, days: number): string {
  return toISODate(addDays(requireISODate(iso), days));
}

/** Noon UTC of an ISO day: far from every midnight, so formatting in UTC never changes the day. */
function noonUTC(iso: string): Date {
  const date = requireISODate(iso);
  const instant = new Date(0);
  instant.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  instant.setUTCHours(12, 0, 0, 0);
  return instant;
}

function intlTag(system: CalendarSystem, { locale, numerals }: DateFormatOptions): string {
  const tag = resolveIntlLocale(locale, numerals);
  return tag.includes('-u-') ? tag.replace('-u-', `-u-ca-${system}-`) : `${tag}-u-ca-${system}`;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();
const monthNameCache = new Map<string, CalendarMonthName[]>();

function formatterFor(
  system: CalendarSystem,
  options: DateFormatOptions,
  format: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const tag = intlTag(system, options);
  const key = `${tag}|${JSON.stringify(format)}`;
  const cached = formatterCache.get(key);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat(tag, { ...format, timeZone: 'UTC' });
  formatterCache.set(key, formatter);
  return formatter;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}

// ------------------------------------------------------------- conversion

const dateCache = new Map<string, CalendarDate>();

/**
 * `{ year, month, day }` of an ISO day in a calendar system. Numbers are read
 * with Latin digits from an English formatter, so they do not depend on the
 * UI locale; names and labels come from `toCalendarParts`.
 */
export function toCalendarDate(iso: string, system: CalendarSystem): CalendarDate {
  if (system === 'gregory') {
    const date = requireISODate(iso);
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }
  const key = `${system}|${iso}`;
  const cached = dateCache.get(key);
  if (cached) {
    return cached;
  }
  const parts = formatterFor(
    system,
    { locale: 'en', numerals: 'latn' },
    { year: 'numeric', month: 'numeric', day: 'numeric' },
  ).formatToParts(noonUTC(iso));
  const result: CalendarDate = {
    year: Number(partValue(parts, 'year')),
    month: Number(partValue(parts, 'month')),
    day: Number(partValue(parts, 'day')),
  };
  if (dateCache.size >= CACHE_LIMIT) {
    dateCache.clear();
  }
  dateCache.set(key, result);
  return result;
}

/** Day, month and year plus the localised month name and era label. */
export function toCalendarParts(
  iso: string,
  system: CalendarSystem,
  options: DateFormatOptions = {},
): CalendarParts {
  const instant = noonUTC(iso);
  const monthParts = formatterFor(system, options, { month: 'long' }).formatToParts(instant);
  const eraParts = formatterFor(system, options, { era: 'short', year: 'numeric' }).formatToParts(
    instant,
  );
  return {
    ...toCalendarDate(iso, system),
    monthName: partValue(monthParts, 'month'),
    eraLabel: partValue(eraParts, 'era'),
  };
}

// ------------------------------------------------------------ month bounds

/** First day (ISO) of the calendar month containing `iso`. */
export function startOfCalendarMonth(iso: string, system: CalendarSystem): string {
  return shiftISO(iso, 1 - toCalendarDate(iso, system).day);
}

/** Number of days (28-31 Gregorian, 29-30 Hijri) of the month containing `iso`. */
export function calendarMonthLength(iso: string, system: CalendarSystem): number {
  const first = startOfCalendarMonth(iso, system);
  if (system === 'gregory') {
    const { year, month } = toCalendarDate(first, system);
    return daysInMonth(year, month - 1);
  }
  const { month } = toCalendarDate(first, system);
  // Every month has at least 28 days, so scanning starts at the 29th.
  for (let offset = 28; offset < MAX_MONTH_DAYS; offset += 1) {
    if (toCalendarDate(shiftISO(first, offset), system).month !== month) {
      return offset;
    }
  }
  return MAX_MONTH_DAYS;
}

/** Last day (ISO) of the calendar month containing `iso`. */
export function endOfCalendarMonth(iso: string, system: CalendarSystem): string {
  const first = startOfCalendarMonth(iso, system);
  return shiftISO(first, calendarMonthLength(first, system) - 1);
}

/**
 * First day (ISO) of month `month` (1-12) of `year` in `system`.
 * `reference` is any ISO day to start searching from; the closer it is the
 * fewer Intl calls are needed, but any day finds the right month.
 */
export function calendarMonthStart(
  system: CalendarSystem,
  year: number,
  month: number,
  reference: string = DEFAULT_REFERENCE,
): string {
  if (system === 'gregory') {
    return toISODate(createDate(year, month - 1, 1));
  }
  const target = year * 12 + (month - 1);
  const here = toCalendarDate(reference, system);
  let probe = shiftISO(
    startOfCalendarMonth(reference, system),
    Math.round((target - (here.year * 12 + here.month - 1)) * AVERAGE_MONTH_DAYS),
  );
  for (let step = 0; step < MAX_SEARCH_STEPS; step += 1) {
    const found = toCalendarDate(probe, system);
    const difference = found.year * 12 + found.month - 1 - target;
    if (difference === 0) {
      return shiftISO(probe, 1 - found.day);
    }
    if (difference === 1) {
      probe = shiftISO(probe, -found.day);
    } else if (difference === -1) {
      probe = shiftISO(endOfCalendarMonth(probe, system), 1);
    } else {
      probe = shiftISO(probe, -Math.round(difference * AVERAGE_MONTH_DAYS));
    }
  }
  throw new RangeError(`Cannot find month ${month} of year ${year} in ${system}`);
}

/** The 12 first-of-month ISO days of a year in `system`, in month order. */
export function getCalendarYearMonths(system: CalendarSystem, year: number): string[] {
  const first = calendarMonthStart(system, year, 1);
  const starts = [first];
  for (let month = 2; month <= 12; month += 1) {
    starts.push(calendarMonthStart(system, year, month, starts[month - 2] ?? first));
  }
  return starts;
}

// -------------------------------------------------------------- arithmetic

/**
 * Moves by whole months in `system` and keeps the day of the month, clamped to
 * the target month's length (30 Sha'ban + 1 month lands on 29 Ramadan when
 * Ramadan has 29 days).
 */
export function addCalendarMonths(iso: string, amount: number, system: CalendarSystem): string {
  if (system === 'gregory') {
    return toISODate(addMonths(requireISODate(iso), amount));
  }
  if (amount === 0) {
    return iso;
  }
  const { year, month, day } = toCalendarDate(iso, system);
  const index = year * 12 + (month - 1) + amount;
  const start = calendarMonthStart(system, Math.floor(index / 12), (index % 12) + 1, iso);
  return shiftISO(start, Math.min(day, calendarMonthLength(start, system)) - 1);
}

/** Moves by whole years (12 months in every supported system). */
export function addCalendarYears(iso: string, amount: number, system: CalendarSystem): string {
  if (system === 'gregory') {
    return toISODate(addYears(requireISODate(iso), amount));
  }
  return addCalendarMonths(iso, amount * 12, system);
}

// ------------------------------------------------------------- month grid

/**
 * The weeks of the month containing `iso`: rows of 7 starting on
 * `weekStartsOn`, ISO strings for the month's own days and null for the
 * padding days of the neighbouring months. `fixedWeeks` always gives 6 rows.
 */
export function getCalendarMonthGrid(
  iso: string,
  system: CalendarSystem,
  weekStartsOn: WeekStart = 0,
  fixedWeeks = false,
): (string | null)[][] {
  const first = startOfCalendarMonth(iso, system);
  const length = calendarMonthLength(first, system);
  const leading = (requireISODate(first).getDay() - weekStartsOn + 7) % 7;
  const weekCount = fixedWeeks ? 6 : Math.ceil((leading + length) / 7);
  return Array.from({ length: weekCount }, (_unused, week) =>
    Array.from({ length: 7 }, (_unusedDay, day) => {
      const offset = week * 7 + day - leading;
      return offset >= 0 && offset < length ? shiftISO(first, offset) : null;
    }),
  );
}

// ------------------------------------------------------------- formatting

export interface CalendarFormatOptions extends DateFormatOptions {
  dateStyle?: DateStyle;
}

/** `6 جمادى الآخرة 1448 هـ` / `Jumada II 6, 1448 AH`; the era comes from Intl. */
export function formatCalendarDate(
  iso: string,
  system: CalendarSystem,
  { dateStyle = 'long', ...options }: CalendarFormatOptions = {},
): string {
  return formatterFor(system, options, { dateStyle }).format(noonUTC(iso));
}

/** With the weekday: the accessible name of a day. */
export function formatCalendarDateLong(
  iso: string,
  system: CalendarSystem,
  options: DateFormatOptions = {},
): string {
  return formatCalendarDate(iso, system, { ...options, dateStyle: 'full' });
}

/** `جمادى الآخرة 1448 هـ`: the month caption. */
export function formatCalendarMonthYear(
  iso: string,
  system: CalendarSystem,
  options: DateFormatOptions = {},
): string {
  return formatterFor(system, options, { month: 'long', year: 'numeric' }).format(noonUTC(iso));
}

/** Just the day number of the month in `system`. */
export function formatCalendarDay(
  iso: string,
  system: CalendarSystem,
  options: DateFormatOptions = {},
): string {
  return formatterFor(system, options, { day: 'numeric' }).format(noonUTC(iso));
}

/** `10 – 20 Jumada II 1448 AH`; one date when the ends match. */
export function formatCalendarDateRange(
  from: string,
  to: string,
  system: CalendarSystem,
  { dateStyle = 'long', ...options }: CalendarFormatOptions = {},
): string {
  if (from === to) {
    return formatCalendarDate(from, system, { ...options, dateStyle });
  }
  const [start, end] = from <= to ? [from, to] : [to, from];
  return formatterFor(system, options, { dateStyle }).formatRange(noonUTC(start), noonUTC(end));
}

/** A year number with the requested digits and no grouping (`١٤٤٨` or `1448`). */
export function formatCalendarYear(year: number, options: DateFormatOptions = {}): string {
  const tag = resolveIntlLocale(options.locale, options.numerals);
  let formatter = numberFormatCache.get(tag);
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, { useGrouping: false });
    numberFormatCache.set(tag, formatter);
  }
  return formatter.format(year);
}

// ---------------------------------------------------------- dropdown lists

/** The 12 month names of `system` in month order, for a month dropdown. */
export function getCalendarMonthNames(
  system: CalendarSystem,
  options: DateFormatOptions = {},
): CalendarMonthName[] {
  const key = intlTag(system, options);
  const cached = monthNameCache.get(key);
  if (cached) {
    return cached;
  }
  // Names do not depend on the year; any year gives the same twelve.
  const year = system === 'gregory' ? 2026 : 1448;
  const names = getCalendarYearMonths(system, year).map((start, index) => ({
    month: index + 1,
    name: partValue(
      formatterFor(system, options, { month: 'long' }).formatToParts(noonUTC(start)),
      'month',
    ),
  }));
  monthNameCache.set(key, names);
  return names;
}

export interface CalendarYearRangeOptions extends DateFormatOptions {
  /** A day inside the year that must be listed (the year being shown). */
  around: string;
  /** Earliest / latest ISO day the list should reach; absent = `span` years from `around`. */
  from?: string;
  to?: string;
  /** Years either side of `around` when a bound is absent. Default 100. */
  span?: number;
}

/**
 * Consecutive years for a year dropdown, in `system`. Reaches from `from` to
 * `to` when given, otherwise `span` years around `around`; `around`'s own year
 * is always included so the dropdown can show the month being viewed.
 */
export function getCalendarYearRange(
  system: CalendarSystem,
  { around, from, to, span = 100, ...format }: CalendarYearRangeOptions,
): CalendarYear[] {
  const current = toCalendarDate(around, system).year;
  const first = Math.max(
    1,
    Math.min(current, from ? toCalendarDate(from, system).year : current - span),
  );
  const last = Math.max(current, to ? toCalendarDate(to, system).year : current + span);
  return Array.from({ length: last - first + 1 }, (_unused, index) => ({
    year: first + index,
    label: formatCalendarYear(first + index, format),
  }));
}
