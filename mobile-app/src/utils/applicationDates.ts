const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "7 Oct 2026, 10:42 PM" - the day and time an application was saved or submitted.
 * Built by hand rather than with toLocale*String so it reads the same on every phone.
 * Empty when there is no usable date.
 */
export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const hours = date.getHours();
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'AM' : 'PM';

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hour12}:${minutes} ${suffix}`;
}
