import { apiGet, apiPost, apiPatch, apiPut } from './client';
import {
  OpportunityCardResponse,
  OpportunityDetailResponse,
  ElderProfileResponse,
  AdminOpportunityResponse,
  OpportunityAudioResponse,
  CreateOpportunityRequest,
  OpportunityTranscriptionResponse,
} from '../../types/opportunity';

/** Creator-facing read endpoints. */
export const opportunityApi = {
  /** Recommended, urgent and recent together - what the Opportunities page opens with, in one request. */
  browse: () =>
    apiGet<{
      recommended: OpportunityCardResponse[];
      urgent: OpportunityCardResponse[];
      recent: OpportunityCardResponse[];
    }>('/opportunities/browse'),

  getRecommended: (limit = 3) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/recommended?limit=${limit}`),

  getUrgent: (limit = 3) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/urgent?limit=${limit}`),

  getRecent: (limit = 10) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/recent?limit=${limit}`),

  getById: (id: string) => apiGet<OpportunityDetailResponse>(`/opportunities/${id}`),

  /** The knowledge holder's public profile for one opportunity. */
  getElderProfile: (id: string) => apiGet<ElderProfileResponse>(`/opportunities/${id}/elder`),

  /** Backs the filter chips — a real DB search, not a client-side slice of an already-fetched list. */
  search: (params: { category?: string; nearby?: boolean; q?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.nearby) query.set('nearby', 'true');
    if (params.q) query.set('q', params.q);
    query.set('limit', String(params.limit ?? 20));
    return apiGet<OpportunityCardResponse[]>(`/opportunities/search?${query.toString()}`);
  },
};

/** Admin endpoints for managing opportunities and audio submissions. */
export const adminOpportunityApi = {
  getAudioSubmissions: (status = 'ALL') =>
    apiGet<OpportunityAudioResponse[]>(`/admin/opportunities/audios?status=${status}`),

  getAudioSubmission: (id: string) =>
    apiGet<OpportunityAudioResponse>(`/admin/opportunities/audios/${id}`),

  createOpportunity: (body: CreateOpportunityRequest) =>
    apiPost<AdminOpportunityResponse, CreateOpportunityRequest>('/admin/opportunities', body),

  updateOpportunity: (id: string, body: CreateOpportunityRequest) =>
    apiPut<AdminOpportunityResponse, CreateOpportunityRequest>(`/admin/opportunities/${id}`, body),

  publishFromAudio: (audioId: string, body: CreateOpportunityRequest) =>
    apiPost<AdminOpportunityResponse, CreateOpportunityRequest>(`/admin/opportunities/audios/${audioId}/publish`, body),

  getAllOpportunities: (status = 'ALL') =>
    apiGet<AdminOpportunityResponse[]>(`/admin/opportunities?status=${status}`),

  getOpportunity: (id: string) =>
    apiGet<AdminOpportunityResponse>(`/admin/opportunities/${id}`),

  updateOpportunityStatus: (id: string, status: string) =>
    apiPatch<AdminOpportunityResponse, { status: string }>(`/admin/opportunities/${id}/status`, { status }),

  updateAudioStatus: (id: string, status: string) =>
    apiPatch<OpportunityAudioResponse, Record<string, never>>(`/admin/opportunities/audios/${id}/status?status=${encodeURIComponent(status)}`, {}),

  autoTranscribeAudio: (audioId: string) =>
    apiPost<OpportunityTranscriptionResponse, Record<string, never>>(`/admin/opportunities/audios/${audioId}/transcribe`, {}),
};
