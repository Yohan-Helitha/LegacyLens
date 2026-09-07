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

  /** TEMPORARY: self-approve until a real knowledge-holder review UI exists — see the backend controller's javadoc. */
  approve: (id: string) =>
    apiPost<OpportunityApplicationResponse, undefined>(`/opportunity-applications/${id}/approve`, undefined),

  /** Moves an APPROVED application to BOOKED — the "Book" button on the dashboard's Upcoming Booking tab. */
  book: (id: string) =>
    apiPost<OpportunityApplicationResponse, undefined>(`/opportunity-applications/${id}/book`, undefined),

  remove: (id: string) => apiDelete<void>(`/opportunity-applications/${id}`),
};
