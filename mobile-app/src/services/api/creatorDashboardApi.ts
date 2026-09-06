import { apiClient, apiGet } from './client';
import {
  CreatorDashboardSummaryResponse,
  DashboardJobStatus,
  JobResponse,
  LogPaymentRequest,
  PaymentHistoryItemResponse,
  ReviewResponse,
} from '../../types/creatorDashboard';

/** Matches ApiEnvelope in client.ts — not exported there, so mirrored here. */
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Typed wrappers around /api/creator-dashboard/** — all scoped to the logged-in creator. */
export const creatorDashboardApi = {
  getSummary: () => apiGet<CreatorDashboardSummaryResponse>('/creator-dashboard/summary'),

  getJobs: (status: DashboardJobStatus) =>
    apiGet<JobResponse[]>(`/creator-dashboard/jobs?status=${status}`),

  getRecentWork: (limit = 3) =>
    apiGet<JobResponse[]>(`/creator-dashboard/recent-work?limit=${limit}`),

  getReviews: (limit = 5) =>
    apiGet<ReviewResponse[]>(`/creator-dashboard/reviews?limit=${limit}`),

  getPaymentHistory: (limit = 20) =>
    apiGet<PaymentHistoryItemResponse[]>(`/creator-dashboard/payment-history?limit=${limit}`),

  /**
   * multipart/form-data — the proof photo rides alongside the form fields,
   * same pattern as creatorApplicationApi.submit().
   */
  addPayment: async (request: LogPaymentRequest): Promise<PaymentHistoryItemResponse> => {
    const form = new FormData();
    if (request.jobId) form.append('jobId', request.jobId);
    form.append('amount', String(request.amount));
    form.append('tipAmount', String(request.tipAmount));
    form.append('proofDocument', {
      uri: request.proofDocument.uri,
      name: request.proofDocument.name,
      type: request.proofDocument.type,
      // React Native's FormData accepts this file-part shape; axios's
      // browser-oriented Blob/File typing doesn't model it, hence the cast.
    } as unknown as Blob);

    const response = await apiClient.post<ApiEnvelope<PaymentHistoryItemResponse>>(
      '/creator-dashboard/payments',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data.data as PaymentHistoryItemResponse;
  },
};
