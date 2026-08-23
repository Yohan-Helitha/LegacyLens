import { apiGet } from './client';
import { OpportunityCardResponse, OpportunityDetailResponse } from '../../types/opportunity';

/** Typed wrappers around /api/opportunities/** — all read-only for content creators. */
export const opportunityApi = {
  getRecommended: (limit = 3) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/recommended?limit=${limit}`),

  getUrgent: (limit = 3) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/urgent?limit=${limit}`),

  getRecent: (limit = 10) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/recent?limit=${limit}`),

  getById: (id: string) => apiGet<OpportunityDetailResponse>(`/opportunities/${id}`),
};
