import type { HireDisplayStatus, JobRequestStatus } from '../types/hireRequest';

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
