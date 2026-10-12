/**
 * Mirrors lk.ac.sliit.legacylens.contentcapture.dto.RatingSummaryDto /
 * ReviewResponseDto — the feedback other people leave for an elder
 * (GET /api/knowledge-holders/{id}/ratings/summary and /reviews).
 *
 * Deliberately separate from the Trust Score (`types/trustScore.ts`): trust
 * is an activity-based level, this is what people said.
 */
export interface RatingSummary {
  /** Null when the elder has no ratings yet. */
  averageRating: number | null;
  ratingCount: number;
}

export interface Review {
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  /** 1–5 */
  score: number;
  /** Some reviews are rating-only. */
  comment: string | null;
  createdAt: string;
}
