import { apiDelete, apiGet, apiPost } from './client';
import {
  BookApplicationRequest,
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

  /** TEMPORARY: self-reject, standing in for the knowledge holder the same way approve() does. */
  reject: (id: string) =>
    apiPost<OpportunityApplicationResponse, undefined>(`/opportunity-applications/${id}/reject`, undefined),

  /**
   * Moves an APPROVED application to BOOKED and creates the real Job behind
   * it, using the creator's confirmed date/time from the "Confirm Booking" form.
   */
  book: (id: string, request: BookApplicationRequest) =>
    apiPost<OpportunityApplicationResponse, BookApplicationRequest>(
      `/opportunity-applications/${id}/book`,
      request,
    ),

  remove: (id: string) => apiDelete<void>(`/opportunity-applications/${id}`),
};

/**
 * The knowledge holder's side - /api/elder/opportunity-applications. Only the elder who owns the
 * opportunity can see or decide an application to it; anyone else gets "not found".
 */
export const elderApplicationReviewApi = {
  /** Submitted, approved, rejected and booked applications to the signed-in elder's opportunities. */
  list: () => apiGet<OpportunityApplicationResponse[]>('/elder/opportunity-applications'),

  approve: (id: string) =>
    apiPost<OpportunityApplicationResponse, undefined>(`/elder/opportunity-applications/${id}/approve`, undefined),

  reject: (id: string) =>
    apiPost<OpportunityApplicationResponse, undefined>(`/elder/opportunity-applications/${id}/reject`, undefined),
};
