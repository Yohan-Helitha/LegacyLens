/**
 * Mirrors lk.ac.sliit.legacylens.marketplace.dto.WorkSubmission* and WorkFeedbackResponse - work a content
 * creator has submitted, as the admin reviews it (/api/admin/work-review, /api/admin/work-feedback).
 * This is separate from the moderation queue, which holds stories elders record.
 */

export type WorkReviewState = 'AWAITING_REVIEW' | 'CHANGES_REQUESTED' | 'COMPLETED' | 'PUBLISHED';

export interface WorkSubmissionSummary {
  jobId: string;
  title: string;
  creatorId: string;
  opportunityId: string | null;
  creatorName: string;
  elderName: string | null;
  category: string | null;
  submittedAt: string;
  state: WorkReviewState;
  elderApproved: boolean;
  adminApproved: boolean;
  publishedAt: string | null;
  /** Only while CHANGES_REQUESTED: who has an outstanding note. */
  sentBackBy: 'KNOWLEDGE_HOLDER' | 'ADMIN' | 'BOTH' | null;
}

export interface WorkMaterial {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface WorkSubmissionDetail {
  summary: WorkSubmissionSummary;
  /** What the opportunity asked for. */
  brief: string | null;
  introduction: string | null;
  story: string | null;
  seoSummary: string | null;
  seoKeywords: string[] | null;
  materials: WorkMaterial[] | null;
  elderFeedback: string | null;
  elderFeedbackAt: string | null;
  adminFeedback: string | null;
  adminFeedbackAt: string | null;
}

/** Both reviewers' state on one job. */
export interface WorkFeedbackState {
  jobId: string;
  elderApproved: boolean;
  elderFeedback: string | null;
  elderFeedbackAt: string | null;
  adminApproved: boolean;
  adminFeedback: string | null;
  adminFeedbackAt: string | null;
  publishedAt: string | null;
}

/** The server's limit on a decline reason. */
export const MAX_FEEDBACK_LENGTH = 2000;
