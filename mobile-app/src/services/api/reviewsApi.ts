import { apiGet } from './client';
import type { PagedResponse } from '../../types/story';
import type { RatingSummary, Review } from '../../types/review';

/** Typed wrappers around /api/knowledge-holders/{id}/ratings|reviews — feedback left for an elder. */
export const reviewsApi = {
  getSummary: (elderId: string) => apiGet<RatingSummary>(`/knowledge-holders/${elderId}/ratings/summary`),

  /** Newest first (the backend sorts by createdAt desc). */
  getReviews: (elderId: string, { page = 0, size = 50 }: { page?: number; size?: number } = {}) =>
    apiGet<PagedResponse<Review>>(`/knowledge-holders/${elderId}/reviews?page=${page}&size=${size}`),
};
