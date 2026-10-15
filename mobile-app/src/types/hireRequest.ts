/**
 * Mirrors lk.ac.sliit.legacylens.hiring.* — the elder-side "Hire a Creator"
 * backend (POST/GET /api/job-requests/**).
 */

/** Mirrors the backend's JobRequestStatus enum. */
export type JobRequestStatus = 'DRAFT' | 'PENDING_ADMIN_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'CLOSED';

/** Mirrors the backend's JobApplicationStatus enum. */
export type JobApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type HireInputMode = 'VOICE' | 'TEXT';

/** Mirrors JobRequestSummaryDto — the row shape GET /api/job-requests/mine returns. */
export interface JobRequestSummary {
  id: string;
  title: string;
  status: JobRequestStatus;
  applicantCount: number;
  createdAt: string;
  /** Null when the request has no recorded Details clip (inputMode TEXT) — lets the card play it back inline. */
  voiceNoteUrl: string | null;
  /**
   * Not returned by the backend's summary projection today (title only) —
   * the card falls back to `title` for its snippet until it is.
   */
  description?: string | null;
}

/** Mirrors JobRequestResponse — what POST /api/job-requests returns. */
export interface JobRequestResponse {
  id: string;
  title: string;
  description: string | null;
  inputMode: HireInputMode;
  status: JobRequestStatus;
  adminNotes: string | null;
  voiceNoteUrl: string | null;
  createdAt: string;
}

/** Mirrors JobApplicationSummaryDto — one applicant on GET /api/job-requests/{id}/applications. */
export interface JobApplicationSummary {
  id: string;
  creatorId: string;
  creatorName: string;
  /** Null when the creator has no rating yet. Serialised as a number. */
  creatorRating: number | null;
  message: string | null;
  status: JobApplicationStatus;
  appliedAt: string;
}

/**
 * Region and format are deliberately not separate fields: the elder mentions
 * them in the recorded details instead (see the guidance bullets on Screen 8).
 *
 * Details are voice-only — recorded, not typed or dictated — so the admin
 * reviewing a request hears it directly rather than through a speech-to-text
 * transcription. The backend's JobRequestSubmissionDto also accepts a text
 * `description` and inputMode TEXT, but nothing on the mobile side sends
 * that path anymore.
 */
export interface SubmitHireRequestPayload {
  title: string;
  inputMode: HireInputMode;
  /** The recorded details clip — required in practice, since this screen no longer offers a text alternative. */
  voiceNote: { uri: string; name: string; type: string };
}

/**
 * How Screen 9 presents a request. Derived from the backend status plus the
 * applicant count — the backend has no separate "Open"/"Reviewing" states,
 * and no "Completed" state at all yet (a CLOSED request is "Creator
 * Assigned" until that exists).
 */
export type HireDisplayStatus =
  | 'PENDING_REVIEW'
  | 'OPEN'
  | 'REVIEWING'
  | 'ASSIGNED'
  | 'COMPLETED'
  | 'NOT_APPROVED';

/** The creator an elder chose — resolved from the request's ACCEPTED application. */
export interface AssignedCreator {
  creatorId: string;
  name: string;
  rating: number | null;
}
