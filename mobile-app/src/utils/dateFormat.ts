/** "Recorded 2 weeks ago" / "Recorded yesterday" style relative timestamps for story lists. */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Recorded just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Recorded ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Recorded ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Recorded yesterday';
  if (diffDays < 7) return `Recorded ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `Recorded ${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Recorded ${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `Recorded ${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}
