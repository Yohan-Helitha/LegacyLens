/**
 * Creator recommendations for the elder's own opportunities — mirrors
 * GET /api/opportunities/mine/recommended-creators.
 *
 * An elder records an audio description of what they need; an admin turns
 * it into a structured Opportunity (location, date, category, language…) and
 * publishes it. For every opportunity that is still open (PUBLISHED — never
 * COMPLETED/CLOSED ones) the backend ranks creators against it and returns
 * the single best match separately from the rest. One entry per opportunity,
 * so recommendations for different opportunities are never mixed together.
 */

/** The published opportunity a set of recommendations belongs to. */
export interface RecommendationOpportunitySummary {
  opportunityId: string;
  title: string;
  /** Remote URL or a "local:<key>" bundled placeholder — see resolveOpportunityImage. */
  heroImageUrl: string | null;
  category: string | null;
  location: string | null;
  language: string | null;
  /** ISO date (yyyy-MM-dd), or null when not scheduled yet. */
  scheduledDate: string | null;
}

export interface RecommendedCreator {
  creatorId: string;
  name: string;
  avatarUrl: string | null;
  /**
   * How well this creator fits the opportunity, 0–100. Recommendations are
   * always 45+ and a best match 75+ (see the backend's CreatorMatchScorer).
   * Null only for an already-chosen creator who no longer ranks.
   */
  matchPercentage: number | null;
  /** 0–5, or null for a creator with no ratings yet. */
  rating: number | null;
  completedJobs: number;
  /** e.g. "Video documentation". */
  specialty: string | null;
  /** e.g. ["Sinhala", "English"]. */
  languages: string[];
  /** The creator's own short description of their experience. */
  about: string | null;
  /** Plain-language reasons this creator matches the opportunity, strongest first. */
  reasons: string[];
}

export interface OpportunityRecommendations {
  opportunity: RecommendationOpportunitySummary;
  /**
   * Only set when the top creator is a strong fit (75%+ and can do a
   * must-have task). Null when nobody is — `others` may still hold
   * recommendations then, and they are the only ones shown.
   */
  bestMatch: RecommendedCreator | null;
  others: RecommendedCreator[];
  /**
   * The creator the elder already chose for this opportunity (invited, or an
   * application they approved / that was booked). Null until one is chosen.
   */
  chosenCreator: RecommendedCreator | null;
}
