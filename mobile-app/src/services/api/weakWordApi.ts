// mobile-app/src/services/api/weakWordApi.ts
import { apiGet, apiPost } from './client';
import {
  WeakWordSummary,
  ReviewSession,
  SubmitReviewAnswersRequest,
  ReviewResult,
} from '../../types/weakWord';

export const weakWordApi = {
  /** Get all weak words recorded for the current learner. */
  async getMyWeakWords(): Promise<WeakWordSummary[]> {
    return apiGet<WeakWordSummary[]>('/learning/review/weak-words');
  },

  /** Generate an adaptive review session from weak words. */
  async buildReviewSession(limit: number = 5): Promise<ReviewSession> {
    return apiPost<ReviewSession>('/learning/review/session', { limit });
  },

  /** Submit answers for an active review session to update mastery and earn XP. */
  async submitReviewAnswers(request: SubmitReviewAnswersRequest): Promise<ReviewResult> {
    return apiPost<ReviewResult>('/learning/review/session/answers', request);
  },
};
