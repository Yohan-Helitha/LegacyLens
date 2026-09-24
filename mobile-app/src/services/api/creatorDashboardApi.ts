import { apiGet, apiPost } from './client';
import {
  CreatorDashboardSummaryResponse,
  DashboardJobStatus,
  JobResponse,
  PaymentHistoryItemResponse,
  ReviewResponse,
} from '../../types/creatorDashboard';

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

  addPayment: (amount: number, note: string) =>
    apiPost<PaymentHistoryItemResponse, { amount: number; note: string }>(
      '/creator-dashboard/payments',
      { amount, note },
    ),
};
