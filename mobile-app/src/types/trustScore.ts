/** Mirrors TrustScoreDetailDto — GET /api/knowledge-holders/me/trust-score. */
export interface TrustScoreDetail {
  level: number;
  storiesShared: number;
  /** 0 once the highest level is reached. */
  nextMilestoneStoriesNeeded: number;
}
