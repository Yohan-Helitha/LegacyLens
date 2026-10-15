import { formatDate, formatTimeAgo } from '../../src/utils/timeAgo';

describe('formatTimeAgo', () => {
  it('says how long ago in plain words', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(formatTimeAgo(twoHoursAgo, 'en')).toBe('2 hours ago');
  });

  it('uses days for older times', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
    expect(formatTimeAgo(threeDaysAgo, 'en')).toBe('3 days ago');
  });

  it('returns nothing for a missing or invalid time rather than a made-up one', () => {
    expect(formatTimeAgo(null, 'en')).toBe('');
    expect(formatTimeAgo('not a date', 'en')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a calendar date and ignores a missing one', () => {
    expect(formatDate('2026-10-12T08:00:00', 'en')).toMatch(/12/);
    expect(formatDate(undefined, 'en')).toBe('');
  });
});
