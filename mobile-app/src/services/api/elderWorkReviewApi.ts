import { apiGet, apiPost } from './client';
import type {
  CreatorReview,
  WorkFeedbackState,
  WorkSubmissionDetail,
  WorkSubmissionSummary,
} from '../../types/workReview';

/**
 * The knowledge holder's side of submitted work. Everything is limited to the signed-in elder's own jobs
 * by the backend; there is no admin note in what comes back.
 */
export const elderWorkReviewApi = {
  /** The review queue: every job with submitted work, newest first. */
  list: () => apiGet<WorkSubmissionSummary[]>('/elder/work-review'),

  /** Everything submitted for one job. */
  get: (jobId: string) => apiGet<WorkSubmissionDetail>(`/elder/work-review/jobs/${jobId}`),

  /** The elder's current state on a job (approved / earlier note). */
  getFeedback: (jobId: string) => apiGet<WorkFeedbackState>(`/elder/work-feedback/jobs/${jobId}`),

  approve: (jobId: string) =>
    apiPost<WorkFeedbackState, undefined>(`/elder/work-feedback/jobs/${jobId}/approve`, undefined),

  /** Declines with a written reason - the backend has no separate "decline" call; the note is the decline. */
  decline: (jobId: string, message: string) =>
    apiPost<WorkFeedbackState, { message: string }>(`/elder/work-feedback/jobs/${jobId}`, { message }),

  /** The elder's rating of the creator for a job, or null if they have not rated yet. */
  getRating: (jobId: string) => apiGet<CreatorReview | null>(`/elder/creator-rating/jobs/${jobId}`),

  /** Only accepted once the job is COMPLETED. */
  rate: (jobId: string, rating: number, comment?: string) =>
    apiPost<CreatorReview, { rating: number; comment?: string }>(
      `/elder/creator-rating/jobs/${jobId}`,
      comment && comment.trim() ? { rating, comment: comment.trim() } : { rating },
    ),
};
