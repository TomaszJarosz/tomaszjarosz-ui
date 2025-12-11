export {
  // Constants
  DATE_FORMATS,
  LOCALES,
  // Core functions
  parseDate,
  formatDate,
  formatDateTime,
  formatDateShort,
  formatDateNumeric,
  getRelativeTime,
  isToday,
  isYesterday,
  isPast,
  isFuture,
  diffInDays,
} from './dateUtils';

export type { DateInput, LocaleKey } from './dateUtils';
