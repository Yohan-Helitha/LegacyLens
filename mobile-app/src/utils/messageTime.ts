/**
 * Date/time labels for the shared messaging screens. The backend sends server
 * local time without an offset ("2026-10-04T10:40:12"), which JS parses as
 * the phone's local time — the server and the app's users share a timezone.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Whole days between two dates' calendar days (0 = same day, 1 = yesterday). */
const daysAgo = (date: Date, now = new Date()) =>
  Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);

/** "10:40 AM" */
export function formatClockTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return '';
  const hours = date.getHours() % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

/** Inbox row timestamp: today → "10:40 AM", yesterday → "Yesterday", this week → "Mon", older → "25 Aug". */
export function formatConversationTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return '';
  const days = daysAgo(date);
  if (days <= 0) return formatClockTime(iso);
  if (days === 1) return 'Yesterday';
  if (days < 7) return WEEKDAYS[date.getDay()];
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Date divider between messages: "Today", "Yesterday", or "25 Aug 2026". */
export function formatDayLabel(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return '';
  const days = daysAgo(date);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Calendar-day key used to decide where date dividers go. */
export function dayKey(iso: string): string {
  const date = toDate(iso);
  return date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : '';
}

/** Context-card date ("2026-08-25" → "25 Aug"). */
export function formatShortDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${day} ${MONTHS[month - 1]}`;
}
