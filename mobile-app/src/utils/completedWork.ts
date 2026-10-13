import type { JobResponse } from '../types/creatorDashboard';

export interface WorkKind {
  name: string;
  count: number;
}

export interface MonthGroup {
  /** "2026-08", or "undated" for jobs with no usable date. */
  key: string;
  /** "August 2026", or "Date not recorded". */
  label: string;
  jobs: JobResponse[];
  total: number;
  /** What kinds of opportunity were done, most common first; jobs with no known category count as "Other". */
  kinds: WorkKind[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const OTHER = 'Other';

/** When a finished job counts: the day it was completed, else the day it was scheduled. */
function doneDate(job: JobResponse): Date | null {
  const iso = job.completedAt ?? job.scheduledAt;
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Completed jobs grouped by month, newest month first; jobs with no date come last. */
export function groupCompletedByMonth(jobs: JobResponse[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const job of jobs) {
    const date = doneDate(job);
    const key = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 'undated';
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : 'Date not recorded',
        jobs: [],
        total: 0,
        kinds: [],
      };
      groups.set(key, group);
    }
    group.jobs.push(job);
    group.total += job.offeredAmount;

    const name = job.category?.trim() || OTHER;
    const kind = group.kinds.find((k) => k.name === name);
    if (kind) kind.count += 1;
    else group.kinds.push({ name, count: 1 });
  }

  const result = [...groups.values()];
  for (const group of result) {
    // Most common first; "Other" always last so real categories lead.
    group.kinds.sort((a, b) => (a.name === OTHER ? 1 : b.name === OTHER ? -1 : b.count - a.count));
  }
  return result.sort((a, b) => {
    if (a.key === 'undated') return 1;
    if (b.key === 'undated') return -1;
    return b.key.localeCompare(a.key);
  });
}
