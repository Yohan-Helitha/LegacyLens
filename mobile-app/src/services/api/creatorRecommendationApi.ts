import { apiGet, apiPost } from './client';
import type { OpportunityRecommendations } from '../../types/creatorRecommendation';

/** Typed wrappers around the elder-side creator recommendation endpoints. */
export const creatorRecommendationApi = {
  /** One entry per open (PUBLISHED) opportunity of the signed-in elder, newest first. */
  listMine: () => apiGet<OpportunityRecommendations[]>('/opportunities/mine/recommended-creators'),

  /** The elder picks a recommended creator for one of their opportunities. */
  chooseCreator: (opportunityId: string, creatorId: string) =>
    apiPost<void, Record<string, never>>(
      `/opportunities/${opportunityId}/recommended-creators/${creatorId}/choose`,
      {},
    ),
};
