import {
  dayKey,
  formatClockTime,
  formatConversationTime,
  formatDayLabel,
  formatShortDate,
} from '../../src/utils/messageTime';

/** Local-time ISO string without offset, the way the backend sends it. */
const localIso = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const daysBefore = (days: number, hours = 10, minutes = 40) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return localIso(date);
};

describe('messageTime', () => {
  it('formats clock time in 12-hour form', () => {
    expect(formatClockTime('2026-10-04T09:05:00')).toBe('9:05 AM');
    expect(formatClockTime('2026-10-04T00:30:00')).toBe('12:30 AM');
    expect(formatClockTime('2026-10-04T13:15:00')).toBe('1:15 PM');
  });

  it('labels inbox rows relative to today', () => {
    expect(formatConversationTime(daysBefore(0))).toBe('10:40 AM');
    expect(formatConversationTime(daysBefore(1))).toBe('Yesterday');
    expect(formatConversationTime(daysBefore(3))).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
    expect(formatConversationTime(daysBefore(30))).toMatch(/^\d{1,2} [A-Z][a-z]{2}$/);
  });

  it('labels chat day dividers', () => {
    expect(formatDayLabel(daysBefore(0))).toBe('Today');
    expect(formatDayLabel(daysBefore(1))).toBe('Yesterday');
    expect(formatDayLabel('2025-08-25T10:00:00')).toBe('25 Aug 2025');
  });

  it('groups messages from the same calendar day', () => {
    expect(dayKey('2026-08-25T08:00:00')).toBe(dayKey('2026-08-25T22:00:00'));
    expect(dayKey('2026-08-25T23:59:00')).not.toBe(dayKey('2026-08-26T00:01:00'));
  });

  it('formats context-card dates and tolerates missing values', () => {
    expect(formatShortDate('2026-08-25')).toBe('25 Aug');
    expect(formatShortDate(null)).toBe('');
    expect(formatConversationTime(null)).toBe('');
    expect(formatClockTime('not a date')).toBe('');
  });
});
