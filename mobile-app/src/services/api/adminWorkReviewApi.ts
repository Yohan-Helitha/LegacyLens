import { apiGet, apiPost } from './client';
import type { AdminWorkFeedbackState, WorkSubmissionDetail, WorkSubmissionSummary } from '../../types/workReview';

/**
 * The admin's side of work content creators submit (/api/admin/work-review, /api/admin/work-feedback).
 * This is separate from the moderation queue, which is for stories elders record - the two are not mixed.
 * The admin sees both reviewers' notes; the knowledge holder never sees the admin's.
 */
export const adminWorkReviewApi = {
  /** Every job with submitted work, newest first. */
  list: () => apiGet<WorkSubmissionSummary[]>('/admin/work-review'),

  get: (jobId: string) => apiGet<WorkSubmissionDetail>(`/admin/work-review/jobs/${jobId}`),

  getFeedback: (jobId: string) => apiGet<AdminWorkFeedbackState>(`/admin/work-feedback/jobs/${jobId}`),

  approve: (jobId: string) =>
    apiPost<AdminWorkFeedbackState, undefined>(`/admin/work-feedback/jobs/${jobId}/approve`, undefined),

  /** Declines with a written reason - the note is the decline; the backend has no separate call. */
  decline: (jobId: string, message: string) =>
    apiPost<AdminWorkFeedbackState, { message: string }>(`/admin/work-feedback/jobs/${jobId}`, { message }),

  /** Only allowed once both reviewers have approved (the job is COMPLETED). */
  publish: (jobId: string) =>
    apiPost<AdminWorkFeedbackState, undefined>(`/admin/work-feedback/jobs/${jobId}/publish`, undefined),
};
