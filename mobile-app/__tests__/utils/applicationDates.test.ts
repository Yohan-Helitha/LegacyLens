import { formatStamp } from '../../src/utils/applicationDates';

describe('formatStamp', () => {
  it('shows the day and the time on a 12-hour clock', () => {
    expect(formatStamp('2026-10-07T22:42:10')).toBe('7 Oct 2026, 10:42 PM');
    expect(formatStamp('2026-08-28T09:05:00')).toBe('28 Aug 2026, 9:05 AM');
  });

  it('handles midnight and noon', () => {
    expect(formatStamp('2026-01-01T00:00:00')).toBe('1 Jan 2026, 12:00 AM');
    expect(formatStamp('2026-01-01T12:30:00')).toBe('1 Jan 2026, 12:30 PM');
  });

  it('is empty when there is no date', () => {
    expect(formatStamp(null)).toBe('');
    expect(formatStamp(undefined)).toBe('');
    expect(formatStamp('not a date')).toBe('');
  });
});
