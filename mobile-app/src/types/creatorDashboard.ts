export type DashboardJobStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface CreatorDashboardSummaryResponse {
  rating: number | null;
  completedJobsCount: number;
  contributionsCount: number;
  collectedToday: number | null;
}

export interface PaymentHistoryItemResponse {
  id: string;
  /** Set only when this payment (or completed job) is tied to a specific opportunity. */
  jobId: string | null;
  opportunityTitle: string | null;
  elderName: string | null;
  amount: number;
  tipAmount: number;
  /** amount + tipAmount — what the "Collected Today" card and history rows actually display. */
  totalAmount: number;
  /** Relative "/uploads/..." URL of the receipt/proof photo, if one was uploaded. */
  proofDocumentUrl: string | null;
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

/** A file picked via expo-image-picker, shaped for FormData's file part — same shape as CreatorApplicationProofFile. */
export interface PaymentProofFile {
  uri: string;
  name: string;
  type: string;
}

/** Everything the "Log a Payment" page's Add button sends. */
export interface LogPaymentRequest {
  /** The opportunity this payment is for — required by the UI, but optional here since a payment doesn't strictly have to be tied to one. */
  jobId: string | null;
  amount: number;
  tipAmount: number;
  proofDocument: PaymentProofFile;
}
