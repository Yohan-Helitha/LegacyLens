import { apiGet, apiPost, apiPostForm } from './client';
import type {
  JobApplicationSummary,
  JobRequestResponse,
  JobRequestSummary,
  SubmitHireRequestPayload,
} from '../../types/hireRequest';

function toFormData(payload: SubmitHireRequestPayload): FormData {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('inputMode', payload.inputMode);
  return formData;
}

/** Typed wrappers around /api/job-requests/** — the elder-side hiring backend. */
export const hireRequestApi = {
  /** POST /api/job-requests — submits straight to admin review (PENDING_ADMIN_REVIEW). */
  submit: (payload: SubmitHireRequestPayload) =>
    apiPostForm<JobRequestResponse>('/job-requests', toFormData(payload)),

  /** GET /api/job-requests/mine — the elder's own requests with applicant counts. */
  listMine: () => apiGet<JobRequestSummary[]>('/job-requests/mine'),

  getApplications: (jobRequestId: string) =>
    apiGet<JobApplicationSummary[]>(`/job-requests/${jobRequestId}/applications`),

  /** Accepts one applicant; the backend auto-rejects the rest and closes the request. */
  approveApplication: (jobRequestId: string, applicationId: string) =>
    apiPost<void, Record<string, never>>(
      `/job-requests/${jobRequestId}/applications/${applicationId}/approve`,
      {},
    ),

  /** `reason` is optional by design — an elder never has to explain a rejection. */
  rejectApplication: (jobRequestId: string, applicationId: string, reason?: string) =>
    apiPost<void, { reason?: string }>(
      `/job-requests/${jobRequestId}/applications/${applicationId}/reject`,
      reason ? { reason } : {},
    ),
};
