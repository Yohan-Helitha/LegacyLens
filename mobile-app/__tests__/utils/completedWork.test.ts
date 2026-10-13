import { groupCompletedByMonth } from '../../src/utils/completedWork';
import type { JobResponse } from '../../src/types/creatorDashboard';

function job(over: Partial<JobResponse>): JobResponse {
  return {
    id: Math.random().toString(),
    title: 'A job',
    description: '',
    elderName: 'Elder',
    location: null,
    offeredAmount: 1000,
    status: 'COMPLETED',
    urgent: false,
    scheduledAt: null,
    timeWindowText: null,
    completedAt: null,
    category: null,
    ...over,
  };
}

describe('groupCompletedByMonth', () => {
  it('groups by month, newest first, and adds up what was earned', () => {
    const groups = groupCompletedByMonth([
      job({ completedAt: '2026-09-02T12:00:00', offeredAmount: 3000 }),
      job({ completedAt: '2026-08-23T12:00:00', offeredAmount: 4200 }),
      job({ completedAt: '2026-08-22T12:00:00', offeredAmount: 2800 }),
    ]);

    expect(groups.map((g) => g.label)).toEqual(['September 2026', 'August 2026']);
    expect(groups[1].jobs).toHaveLength(2);
    expect(groups[1].total).toBe(7000);
  });

  it('counts the kinds of work, most common first, with unknown ones as Other', () => {
    const [august] = groupCompletedByMonth([
      job({ completedAt: '2026-08-01T12:00:00', category: 'Oral History' }),
      job({ completedAt: '2026-08-02T12:00:00', category: 'Photography' }),
      job({ completedAt: '2026-08-03T12:00:00', category: 'Oral History' }),
      job({ completedAt: '2026-08-04T12:00:00', category: null }),
    ]);

    expect(august.kinds).toEqual([
      { name: 'Oral History', count: 2 },
      { name: 'Photography', count: 1 },
      { name: 'Other', count: 1 },
    ]);
  });

  it('falls back to the scheduled date, and puts undated jobs last', () => {
    const groups = groupCompletedByMonth([
      job({ completedAt: null, scheduledAt: null }),
      job({ completedAt: null, scheduledAt: '2026-07-15T12:00:00' }),
    ]);

    expect(groups.map((g) => g.label)).toEqual(['July 2026', 'Date not recorded']);
  });

  it('is empty for no jobs', () => {
    expect(groupCompletedByMonth([])).toEqual([]);
  });
});
