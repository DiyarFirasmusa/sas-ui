/**
 * Pure date and time helpers for the calendar, date pickers and time picker.
 *
 * Dates here are always LOCAL calendar days at 00:00. ISO strings are the plain
 * `yyyy-mm-dd` form (never `toISOString()`, which converts to UTC and shifts
 * the day for users east or west of Greenwich). All names and digits come from
 * Intl, never from hardcoded tables.
 */

/** `latn` = Latin digits (default); `locale` = the locale's own (Arabic-Indic for ar). */
export type DateNumerals = 'latn' | 'locale';
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DateStyle = 'full' | 'long' | 'medium' | 'short';

export interface DateFormatOptions {
  /** `ar`, `en` or a full tag such as `ar-IQ`. Bare `ar`/`en` become `ar-IQ`/`en-US`. */
  locale?: string;
  numerals?: DateNumerals;
}

const MS_PER_DAY = 86_400_000;
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ---------------------------------------------------------------- creation

/** Local date at 00:00. `new Date(y, …)` maps years 0-99 to 1900+, so set it explicitly. */
export function createDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfDay(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return createDate(date.getFullYear(), date.getMonth() + 1, 0);
}

export function daysInMonth(year: number, month: number): number {
  return createDate(year, month + 1, 0).getDate();
}

// ------------------------------------------------------------- ISO strings

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/** `2026-11-16` from a local date. */
export function toISODate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Strict `yyyy-mm-dd` → local date, or null when malformed or not a real day (2026-02-30). */
export function parseISODate(value: string | null | undefined): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = ISO_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = createDate(year, month, day);
  const isReal =
    date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
  return isReal ? date : null;
}

export function isValidISODate(value: string | null | undefined): boolean {
  return parseISODate(value) !== null;
}

// -------------------------------------------------------------- arithmetic

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Negative when `a` is before `b`, 0 on the same day, positive after. */
export function compareDays(a: Date, b: Date): number {
  const diff = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
    Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.sign(diff);
}

/** Whole days from `a` to `b` (DST-safe: counts calendar days, not 24h blocks). */
export function differenceInDays(a: Date, b: Date): number {
  const diff = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(diff / MS_PER_DAY);
}

export function addDays(date: Date, amount: number): Date {
  return createDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

/** Moves by whole months and keeps the day, clamped to the target month's length (Jan 31 + 1 = Feb 28). */
export function addMonths(date: Date, amount: number): Date {
  const target = createDate(date.getFullYear(), date.getMonth() + amount, 1);
  const day = Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth()));
  return createDate(target.getFullYear(), target.getMonth(), day);
}

export function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * 12);
}

/** First day of the week containing `date`. */
export function startOfWeek(date: Date, weekStartsOn: WeekStart): Date {
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -offset);
}

export function endOfWeek(date: Date, weekStartsOn: WeekStart): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

// ------------------------------------------------------- bounds and ranges

/** Pulls `date` into [min, max]; either bound may be absent. */
export function clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && compareDays(date, min) < 0) {
    return min;
  }
  if (max && compareDays(date, max) > 0) {
    return max;
  }
  return date;
}

export function isOutOfBounds(date: Date, min?: Date | null, max?: Date | null): boolean {
  return (!!min && compareDays(date, min) < 0) || (!!max && compareDays(date, max) > 0);
}

export interface DayRange {
  from: Date | null;
  to: Date | null;
}

/** Inclusive containment; an open-ended range (no `to`) only contains its start. */
export function isWithinRange(date: Date, from: Date | null, to: Date | null): boolean {
  if (!from) {
    return false;
  }
  if (!to) {
    return isSameDay(date, from);
  }
  const [start, end] = compareDays(from, to) <= 0 ? [from, to] : [to, from];
  return compareDays(date, start) >= 0 && compareDays(date, end) <= 0;
}

/**
 * Next range after a click. First click starts a range; the second completes
 * it (clicking earlier than the start swaps, so either order works); a click
 * on a complete range starts over.
 */
export function nextRange(current: DayRange, clicked: Date): DayRange {
  if (current.from && !current.to) {
    return compareDays(clicked, current.from) < 0
      ? { from: clicked, to: current.from }
      : { from: current.from, to: clicked };
  }
  return { from: clicked, to: null };
}

// -------------------------------------------------------------- month grid

/**
 * The weeks to render for a month: arrays of 7 dates beginning on
 * `weekStartsOn`, padded with days of the neighbouring months. `fixedWeeks`
 * always yields 6 rows so the popup does not change height between months.
 */
export function getMonthGrid(
  year: number,
  month: number,
  weekStartsOn: WeekStart = 0,
  fixedWeeks = false,
): Date[][] {
  const first = createDate(year, month, 1);
  const gridStart = startOfWeek(first, weekStartsOn);
  const leading = differenceInDays(gridStart, first);
  const weekCount = fixedWeeks ? 6 : Math.ceil((leading + daysInMonth(year, month)) / 7);
  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}

/** Week start convention per UI language: Saturday for Arabic, Sunday otherwise. */
export function defaultWeekStartsOn(locale: string): WeekStart {
  return locale.toLowerCase().startsWith('ar') ? 6 : 0;
}

// -------------------------------------------------------------- formatting

/**
 * The BCP 47 tag handed to Intl. Latin digits are forced with `-u-nu-latn`
 * because Arabic locales default to Arabic-Indic digits, which most
 * Iraqi business UIs do not want in dates. `numerals: 'locale'` opts in.
 */
export function resolveIntlLocale(locale = 'en', numerals: DateNumerals = 'latn'): string {
  const lower = locale.toLowerCase();
  const isArabic = lower === 'ar' || lower.startsWith('ar-');
  const base = locale === 'ar' ? 'ar-IQ' : locale === 'en' ? 'en-US' : locale;
  if (numerals === 'latn') {
    return `${base}-u-nu-latn`;
  }
  return isArabic ? `${base}-u-nu-arab` : base;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(
  { locale, numerals }: DateFormatOptions,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const tag = resolveIntlLocale(locale, numerals);
  const key = `${tag}|${JSON.stringify(options)}`;
  const cached = formatterCache.get(key);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.DateTimeFormat(tag, options);
  formatterCache.set(key, formatter);
  return formatter;
}

/** `November 16, 2026` / `16 تشرين الثاني 2026` by default (`dateStyle: 'long'`). */
export function formatDate(
  date: Date,
  { dateStyle = 'long', ...options }: DateFormatOptions & { dateStyle?: DateStyle } = {},
): string {
  return dateFormatter(options, { dateStyle }).format(date);
}

/** `Monday, November 16, 2026`: the accessible name of a calendar day. */
export function formatDateLong(date: Date, options: DateFormatOptions = {}): string {
  return formatDate(date, { ...options, dateStyle: 'full' });
}

export function formatMonthYear(date: Date, options: DateFormatOptions = {}): string {
  return dateFormatter(options, { month: 'long', year: 'numeric' }).format(date);
}

export function formatDayNumber(date: Date, options: DateFormatOptions = {}): string {
  return dateFormatter(options, { day: 'numeric' }).format(date);
}

/** `Nov 16 – 20, 2026`; falls back to a single date when the ends match or one is missing. */
export function formatDateRange(
  from: Date,
  to: Date | null,
  { dateStyle = 'long', ...options }: DateFormatOptions & { dateStyle?: DateStyle } = {},
): string {
  if (!to || isSameDay(from, to)) {
    return formatDate(from, { ...options, dateStyle });
  }
  const [start, end] = compareDays(from, to) <= 0 ? [from, to] : [to, from];
  return dateFormatter(options, { dateStyle }).formatRange(start, end);
}

export interface WeekdayName {
  /** Date.getDay() index, 0 = Sunday. */
  index: number;
  long: string;
  narrow: string;
}

/** The seven weekday names in display order, starting at `weekStartsOn`. */
export function getWeekdays(
  weekStartsOn: WeekStart,
  options: DateFormatOptions = {},
): WeekdayName[] {
  const long = dateFormatter(options, { weekday: 'long' });
  const narrow = dateFormatter(options, { weekday: 'narrow' });
  // 2023-01-01 is a Sunday, so offset i has getDay() === i.
  return Array.from({ length: 7 }, (_, offset) => {
    const index = (weekStartsOn + offset) % 7;
    const sample = createDate(2023, 0, 1 + index);
    return { index, long: long.format(sample), narrow: narrow.format(sample) };
  });
}

// ------------------------------------------------------------------- time

export interface TimeOfDay {
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
}

export type DayPeriod = 'am' | 'pm';

/** Strict `HH:mm` (24h) → parts, or null. */
export function parseTime(value: string | null | undefined): TimeOfDay | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = TIME_PATTERN.exec(value);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

export function formatTime({ hour, minute }: TimeOfDay): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** 0 → 12 am, 12 → 12 pm, 15 → 3 pm. */
export function to12Hour(hour: number): { hour: number; period: DayPeriod } {
  return { hour: hour % 12 === 0 ? 12 : hour % 12, period: hour >= 12 ? 'pm' : 'am' };
}

/** Inverse of `to12Hour`: 12 am → 0, 12 pm → 12. */
export function to24Hour(hour: number, period: DayPeriod): number {
  return (hour % 12) + (period === 'pm' ? 12 : 0);
}

/** Moves `value` by `delta`, wrapping inside [min, max]. */
export function stepWithin(value: number, delta: number, min: number, max: number): number {
  const size = max - min + 1;
  return ((((value - min + delta) % size) + size) % size) + min;
}

/** AM/PM labels from Intl (`AM`/`PM`, `ص`/`م`). */
export function getDayPeriodLabels(options: DateFormatOptions = {}): Record<DayPeriod, string> {
  const formatter = dateFormatter(options, { hour: 'numeric', hour12: true });
  const label = (hour: number) =>
    formatter
      .formatToParts(new Date(2023, 0, 1, hour))
      .find((part) => part.type === 'dayPeriod')?.value ?? '';
  return { am: label(9), pm: label(15) };
}
