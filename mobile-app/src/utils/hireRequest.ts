import type { HireDisplayStatus, JobRequestStatus } from '../types/hireRequest';

/** Mirrors JobRequestServiceImpl.DELETE_WINDOW — how long after posting a request can still be deleted outright. */
export const HIRE_REQUEST_DELETE_WINDOW_MS = 60 * 60 * 1000;

/** Mirrors JobRequestServiceImpl.DELETABLE_STATUSES — deletable only before an admin has acted on it. */
const DELETABLE_STATUSES: readonly JobRequestStatus[] = ['DRAFT', 'PENDING_ADMIN_REVIEW'];

/**
 * Client-side mirror of the backend's delete rule, so the Delete button's
 * enabled state matches what the server will actually allow — the server
 * re-checks this itself regardless, this is only for not showing an
 * affordance that would just fail.
 */
export function isHireRequestDeletable(status: JobRequestStatus, createdAt: string): boolean {
  if (!DELETABLE_STATUSES.includes(status)) return false;
  const postedAt = new Date(createdAt).getTime();
  if (Number.isNaN(postedAt)) return false;
  return Date.now() - postedAt < HIRE_REQUEST_DELETE_WINDOW_MS;
}

/**
 * Backend status + applicant count → the status Screen 9 shows. Returns
 * null for DRAFT: this flow never creates drafts, so they aren't "posted
 * requests" and stay out of the list.
 */
export function toHireDisplayStatus(
  status: JobRequestStatus,
  applicantCount: number,
): HireDisplayStatus | null {
  switch (status) {
    case 'DRAFT':
      return null;
    case 'PENDING_ADMIN_REVIEW':
      return 'PENDING_REVIEW';
    case 'PUBLISHED':
      return applicantCount > 0 ? 'REVIEWING' : 'OPEN';
    case 'CLOSED':
      return 'ASSIGNED';
    case 'REJECTED':
      return 'NOT_APPROVED';
  }
}
