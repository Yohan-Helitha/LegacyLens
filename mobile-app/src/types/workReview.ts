/**
 * Mirrors lk.ac.sliit.legacylens.marketplace.dto.WorkSubmission* / WorkFeedbackResponse / CreatorReviewResponse -
 * the knowledge holder's side of reviewing work a content creator has submitted
 * (/api/elder/work-review, /api/elder/work-feedback, /api/elder/creator-rating).
 */
import type { WorkMaterialResponse } from './workProgress';

export type WorkReviewState = 'AWAITING_REVIEW' | 'CHANGES_REQUESTED' | 'COMPLETED' | 'PUBLISHED';

/** One row of the review queue. */
export interface WorkSubmissionSummary {
  jobId: string;
  title: string;
  creatorId: string;
  /** The opportunity the job came from - needed to open a chat about it. Null if that opportunity is gone. */
  opportunityId: string | null;
  creatorName: string;
  elderName: string | null;
  category: string | null;
  submittedAt: string;
  state: WorkReviewState;
  elderApproved: boolean;
  adminApproved: boolean;
  publishedAt: string | null;
}

/** Everything the creator submitted for one job. */
export interface WorkSubmissionDetail {
  summary: WorkSubmissionSummary;
  /** What the opportunity asked for. */
  brief: string | null;
  introduction: string | null;
  story: string | null;
  seoSummary: string | null;
  seoKeywords: string[] | null;
  materials: WorkMaterialResponse[] | null;
  /** This elder's own note from an earlier decline; the admin's note is never sent to the elder. */
  elderFeedback: string | null;
  elderFeedbackAt: string | null;
}

export interface WorkFeedbackState {
  jobId: string;
  elderFeedback: string | null;
  elderFeedbackAt: string | null;
  elderApproved: boolean;
  publishedAt: string | null;
}

export interface CreatorReview {
  jobId: string;
  rating: number;
  comment: string | null;
  creatorRating: number | null;
  creatorRatingCount: number;
}

/** The server's limit on a decline reason. */
export const MAX_FEEDBACK_LENGTH = 2000;
/** The server's limit on a rating comment. */
export const MAX_RATING_COMMENT_LENGTH = 1000;
