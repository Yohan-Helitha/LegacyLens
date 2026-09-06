export type DashboardJobStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface CreatorDashboardSummaryResponse {
  rating: number | null;
  completedJobsCount: number;
  contributionsCount: number;
  collectedToday: number | null;
}

export interface PaymentHistoryItemResponse {
  id: string;
  amount: number;
  collectedAt: string;
  note: string | null;
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  elderName: string;
  location: string | null;
  offeredAmount: number;
  status: DashboardJobStatus;
  /** Static, admin/seed-set flag — shown as a distinct dot colour on OpportunitySchedulePage's calendar. */
  urgent: boolean;
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
