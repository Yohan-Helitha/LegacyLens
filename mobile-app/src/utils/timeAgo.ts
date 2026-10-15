import type { AppLocale } from '../store/localeStore';

const LOCALE_TAG: Record<AppLocale, string> = { en: 'en-GB', si: 'si-LK', ta: 'ta-LK' };

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "2 hours ago" in the app's language; falls back to the plain date if the phone can't format it. */
export function formatTimeAgo(iso: string | null | undefined, locale: AppLocale): string {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const seconds = Math.round((then.getTime() - Date.now()) / 1000);
  try {
    const formatter = new Intl.RelativeTimeFormat(LOCALE_TAG[locale], { numeric: 'auto' });
    for (const [unit, size] of UNITS) {
      if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }
    return formatter.format(0, 'second');
  } catch {
    return then.toLocaleDateString(LOCALE_TAG[locale]);
  }
}

/** A calendar date in the app's language, e.g. "12 Oct 2026". */
export function formatDate(iso: string | null | undefined, locale: AppLocale): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleDateString(LOCALE_TAG[locale], { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return date.toDateString();
  }
}
