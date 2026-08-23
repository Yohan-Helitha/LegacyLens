export type DashboardJobStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface CreatorDashboardSummaryResponse {
  rating: number | null;
  completedJobsCount: number;
  contributionsCount: number;
  availableBalance: number | null;
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  elderName: string;
  location: string | null;
  offeredAmount: number;
  status: DashboardJobStatus;
  scheduledAt: string | null;
  completedAt: string | null;
}

export interface ReviewResponse {
  id: string;
  rating: number;
  comment: string;
  elderName: string;
  createdAt: string;
}
