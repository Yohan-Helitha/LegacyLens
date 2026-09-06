/**
 * Mirrors lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplication* and
 * OpportunityApplicationStatus — the "apply to an opportunity" endpoints
 * under /api/opportunity-applications/**.
 */

export type OpportunityApplicationStatus = 'SAVED' | 'PENDING' | 'APPROVED';

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
  status: OpportunityApplicationStatus;
  savedAt: string;
  submittedAt: string | null;
}

/** Everything the Save button on OpportunityApplicationForm sends. */
export interface SaveOpportunityApplicationRequest {
  opportunityId: string;
  skills: string[];
  experienceText: string;
  approachText: string;
  availabilityConfirmed: boolean;
  equipment: string[];
}
