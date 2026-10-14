import { apiGet } from './client';

export interface DashboardStatsResponse {
  totalUsers: number;
  pendingVerifications: number;
  verifiedUsers: number;
  suspendedUsers: number;
  totalAdmins: number;
  activeAdmins: number;
  totalStories: number;
  pendingModeration: number;
  publishedStories: number;
  rejectedStories: number;
  archivedStories: number;
}

export const dashboardApi = {
  getStats: () => apiGet<DashboardStatsResponse>('/admin/dashboard/stats'),
};

