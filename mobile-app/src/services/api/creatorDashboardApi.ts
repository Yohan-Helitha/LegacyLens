import { apiGet } from './client';
import {
  CreatorDashboardSummaryResponse,
  DashboardJobStatus,
  JobResponse,
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
};
