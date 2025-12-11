/**
 * Date formatting utilities using native Intl API
 * No external dependencies required
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const DATE_FORMATS = {
  /** Full date: "December 11, 2025" */
  DEFAULT: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  /** Short date: "Dec 11, 2025" */
  SHORT: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  /** Numeric date: "12/11/2025" */
  NUMERIC: {
    year: 'numeric' as const,
    month: '2-digit' as const,
    day: '2-digit' as const,
  },
  /** Time only: "14:30" */
  TIME: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
  /** Full datetime: "December 11, 2025, 14:30" */
  DATETIME: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
} as const;

export const LOCALES = {
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  PL: 'pl-PL',
  DE: 'de-DE',
  FR: 'fr-FR',
  ES: 'es-ES',
} as const;

const RELATIVE_TIME_THRESHOLDS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// ============================================================================
// TYPES
// ============================================================================

export type DateInput = string | Date | number | null | undefined;
export type LocaleKey = keyof typeof LOCALES;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Safely creates Date object from various input types
 *
 * @param dateInput - Date input to parse (string, Date, number, null, undefined)
 * @returns Parsed Date object or null if invalid
 *
 * @example
 * parseDate('2025-12-11') // Date object
 * parseDate(1733922000000) // Date object
 * parseDate(new Date()) // Date object
 * parseDate('invalid') // null
 */
export function parseDate(dateInput: DateInput): Date | null {
  if (!dateInput) return null;

  try {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Formats date using specified locale and options
 *
 * @param dateInput - Date to format
 * @param options - Intl.DateTimeFormat options (use DATE_FORMATS constants)
 * @param locale - Locale string (use LOCALES constants)
 * @returns Formatted date string or empty string if invalid
 *
 * @example
 * formatDate('2025-12-11') // "December 11, 2025"
 * formatDate('2025-12-11', DATE_FORMATS.SHORT) // "Dec 11, 2025"
 * formatDate('2025-12-11', DATE_FORMATS.DEFAULT, LOCALES.PL) // "11 grudnia 2025"
 */
export function formatDate(
  dateInput: DateInput,
  options: Intl.DateTimeFormatOptions = DATE_FORMATS.DEFAULT,
  locale: string = LOCALES.EN_US
): string {
  const date = parseDate(dateInput);
  if (!date) return '';

  try {
    return date.toLocaleDateString(locale, options);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Formats date with time
 *
 * @example
 * formatDateTime('2025-12-11T14:30:00') // "December 11, 2025, 2:30 PM"
 */
export function formatDateTime(
  dateInput: DateInput,
  locale: string = LOCALES.EN_US
): string {
  return formatDate(dateInput, DATE_FORMATS.DATETIME, locale);
}

/**
 * Formats date in short format
 *
 * @example
 * formatDateShort('2025-12-11') // "Dec 11, 2025"
 */
export function formatDateShort(
  dateInput: DateInput,
  locale: string = LOCALES.EN_US
): string {
  return formatDate(dateInput, DATE_FORMATS.SHORT, locale);
}

/**
 * Formats date in numeric format
 *
 * @example
 * formatDateNumeric('2025-12-11') // "12/11/2025"
 */
export function formatDateNumeric(
  dateInput: DateInput,
  locale: string = LOCALES.EN_US
): string {
  return formatDate(dateInput, DATE_FORMATS.NUMERIC, locale);
}

/**
 * Gets relative time string (e.g., "2 days ago", "in 3 hours")
 *
 * @param dateInput - Date to compare
 * @param referenceDate - Reference date (defaults to now)
 * @returns Relative time string
 *
 * @example
 * getRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 * getRelativeTime(new Date(Date.now() + 86400000)) // "in 1 day"
 */
export function getRelativeTime(
  dateInput: DateInput,
  referenceDate: DateInput = new Date()
): string {
  const date = parseDate(dateInput);
  const reference = parseDate(referenceDate);

  if (!date || !reference) return '';

  const diff = reference.getTime() - date.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff > 0;

  let value: number;
  let unit: string;

  if (absDiff < RELATIVE_TIME_THRESHOLDS.MINUTE) {
    return 'just now';
  } else if (absDiff < RELATIVE_TIME_THRESHOLDS.HOUR) {
    value = Math.floor(absDiff / RELATIVE_TIME_THRESHOLDS.MINUTE);
    unit = value === 1 ? 'minute' : 'minutes';
  } else if (absDiff < RELATIVE_TIME_THRESHOLDS.DAY) {
    value = Math.floor(absDiff / RELATIVE_TIME_THRESHOLDS.HOUR);
    unit = value === 1 ? 'hour' : 'hours';
  } else if (absDiff < RELATIVE_TIME_THRESHOLDS.WEEK) {
    value = Math.floor(absDiff / RELATIVE_TIME_THRESHOLDS.DAY);
    unit = value === 1 ? 'day' : 'days';
  } else if (absDiff < RELATIVE_TIME_THRESHOLDS.MONTH) {
    value = Math.floor(absDiff / RELATIVE_TIME_THRESHOLDS.WEEK);
    unit = value === 1 ? 'week' : 'weeks';
  } else if (absDiff < RELATIVE_TIME_THRESHOLDS.YEAR) {
    value = Math.floor(absDiff / RELATIVE_TIME_THRESHOLDS.MONTH);
    unit = value === 1 ? 'month' : 'months';
  } else {
    value = Math.floor(absDiff / RELATIVE_TIME_THRESHOLDS.YEAR);
    unit = value === 1 ? 'year' : 'years';
  }

  return isPast ? `${value} ${unit} ago` : `in ${value} ${unit}`;
}

/**
 * Checks if date is today
 *
 * @example
 * isToday(new Date()) // true
 * isToday('2020-01-01') // false
 */
export function isToday(dateInput: DateInput): boolean {
  const date = parseDate(dateInput);
  if (!date) return false;

  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Checks if date is yesterday
 *
 * @example
 * isYesterday(new Date(Date.now() - 86400000)) // true
 */
export function isYesterday(dateInput: DateInput): boolean {
  const date = parseDate(dateInput);
  if (!date) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

/**
 * Checks if date is in the past
 *
 * @example
 * isPast('2020-01-01') // true
 * isPast('2030-01-01') // false
 */
export function isPast(dateInput: DateInput): boolean {
  const date = parseDate(dateInput);
  if (!date) return false;
  return date.getTime() < Date.now();
}

/**
 * Checks if date is in the future
 *
 * @example
 * isFuture('2030-01-01') // true
 * isFuture('2020-01-01') // false
 */
export function isFuture(dateInput: DateInput): boolean {
  const date = parseDate(dateInput);
  if (!date) return false;
  return date.getTime() > Date.now();
}

/**
 * Gets the difference between two dates in days
 *
 * @example
 * diffInDays('2025-12-11', '2025-12-01') // 10
 */
export function diffInDays(
  dateInput1: DateInput,
  dateInput2: DateInput
): number | null {
  const date1 = parseDate(dateInput1);
  const date2 = parseDate(dateInput2);

  if (!date1 || !date2) return null;

  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diffTime / RELATIVE_TIME_THRESHOLDS.DAY);
}
