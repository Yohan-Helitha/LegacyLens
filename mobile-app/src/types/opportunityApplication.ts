/**
 * Mirrors lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplication* and
 * OpportunityApplicationStatus — the "apply to an opportunity" endpoints
 * under /api/opportunity-applications/**.
 */

import type { CreatorLanguage } from './creatorApplication';

export type OpportunityApplicationStatus = 'SAVED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BOOKED';

export interface OpportunityApplicationResponse {
  id: string;
  opportunityId: string;
  title: string;
  elderName: string;
  location: string | null;
  heroImageUrl: string | null;
  scheduledDate: string | null;
  timeWindowText: string | null;
  offeredAmount: number;
  skills: string[];
  experienceText: string | null;
  approachText: string | null;
  availabilityConfirmed: boolean;
  equipment: string[];
  /** The languages the creator offered for this opportunity; empty for older drafts. */
  languages?: CreatorLanguage[];
  status: OpportunityApplicationStatus;
  savedAt: string;
  submittedAt: string | null;
}

/** Everything the "Confirm Booking" form sends — the creator's agreed date/time with the elder. */
export interface BookApplicationRequest {
  /** "YYYY-MM-DD" */
  confirmedDate: string;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
}

/** Everything the Save button on OpportunityApplicationForm sends. */
export interface SaveOpportunityApplicationRequest {
  opportunityId: string;
  skills: string[];
  experienceText: string;
  approachText: string;
  availabilityConfirmed: boolean;
  equipment: string[];
  /** One "Language:LEVEL" text per language, e.g. "Sinhala:FLUENT". */
  languages: string[];
}
