import { apiDelete, apiGet, apiPost } from './client';
import {
  OpportunityApplicationResponse,
  SaveOpportunityApplicationRequest,
} from '../../types/opportunityApplication';

/** Typed wrappers around /api/opportunity-applications/**. */
export const opportunityApplicationApi = {
  saveDraft: (request: SaveOpportunityApplicationRequest) =>
    apiPost<OpportunityApplicationResponse, SaveOpportunityApplicationRequest>(
      '/opportunity-applications',
      request,
    ),

  getMyApplications: () =>
    apiGet<OpportunityApplicationResponse[]>('/opportunity-applications/me'),

  /** Null when the creator hasn't saved anything for this opportunity yet — not an error. */
  getByOpportunity: (opportunityId: string) =>
    apiGet<OpportunityApplicationResponse | null>(
      `/opportunity-applications/by-opportunity/${opportunityId}`,
    ),

  submit: (id: string) =>
    apiPost<OpportunityApplicationResponse, undefined>(`/opportunity-applications/${id}/submit`, undefined),

  remove: (id: string) => apiDelete<void>(`/opportunity-applications/${id}`),
};
