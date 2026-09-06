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

  /** Backs the filter chips — a real DB search, not a client-side slice of an already-fetched list. */
  search: (params: { category?: string; nearby?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.nearby) query.set('nearby', 'true');
    query.set('limit', String(params.limit ?? 20));
    return apiGet<OpportunityCardResponse[]>(`/opportunities/search?${query.toString()}`);
  },
};
