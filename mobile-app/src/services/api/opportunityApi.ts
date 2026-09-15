import { apiGet, apiPost, apiPatch } from './client';
import {
  OpportunityCardResponse,
  OpportunityDetailResponse,
  AdminOpportunityResponse,
  OpportunityAudioResponse,
  CreateOpportunityRequest,
} from '../../types/opportunity';

/** Creator-facing read endpoints. */
export const opportunityApi = {
  getRecommended: (limit = 3) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/recommended?limit=${limit}`),

  getUrgent: (limit = 3) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/urgent?limit=${limit}`),

  getRecent: (limit = 10) =>
    apiGet<OpportunityCardResponse[]>(`/opportunities/recent?limit=${limit}`),

  getById: (id: string) => apiGet<OpportunityDetailResponse>(`/opportunities/${id}`),
};

/** Admin endpoints for managing opportunities and audio submissions. */
export const adminOpportunityApi = {
  getAudioSubmissions: (status = 'ALL') =>
    apiGet<OpportunityAudioResponse[]>(`/admin/opportunities/audios?status=${status}`),

  getAudioSubmission: (id: string) =>
    apiGet<OpportunityAudioResponse>(`/admin/opportunities/audios/${id}`),

  createOpportunity: (body: CreateOpportunityRequest) =>
    apiPost<AdminOpportunityResponse, CreateOpportunityRequest>('/admin/opportunities', body),

  publishFromAudio: (audioId: string, body: CreateOpportunityRequest) =>
    apiPost<AdminOpportunityResponse, CreateOpportunityRequest>(`/admin/opportunities/audios/${audioId}/publish`, body),

  getAllOpportunities: (status = 'ALL') =>
    apiGet<AdminOpportunityResponse[]>(`/admin/opportunities?status=${status}`),

  getOpportunity: (id: string) =>
    apiGet<AdminOpportunityResponse>(`/admin/opportunities/${id}`),

  updateOpportunityStatus: (id: string, status: string) =>
    apiPatch<AdminOpportunityResponse, { status: string }>(`/admin/opportunities/${id}/status`, { status }),
};
