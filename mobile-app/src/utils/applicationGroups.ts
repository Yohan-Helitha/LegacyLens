import type { OpportunityApplicationResponse } from '../types/opportunityApplication';

export interface ApplicationGroups {
  /** Drafts the creator can still edit. */
  saved: OpportunityApplicationResponse[];
  /** Sent and still waiting for the knowledge holder. */
  waiting: OpportunityApplicationResponse[];
  /** Turned down by the knowledge holder. */
  rejected: OpportunityApplicationResponse[];
  /**
   * How many applications were sent and are still this page's business: waiting plus rejected.
   * An approved one has moved on to booking, so it is no longer counted here.
   */
  sentCount: number;
}

export function groupApplications(applications: OpportunityApplicationResponse[]): ApplicationGroups {
  const saved = applications.filter((a) => a.status === 'SAVED');
  const waiting = applications.filter((a) => a.status === 'PENDING');
  const rejected = applications.filter((a) => a.status === 'REJECTED');
  return { saved, waiting, rejected, sentCount: waiting.length + rejected.length };
}

/** "3 sent" - the count shown on the Submitted section; a rejected application is still one that was sent. */
export function sentLabel(sentCount: number): string {
  return `${sentCount} sent`;
}

/** The red number on the menu: how many rejected applications there are, shown as "9+" past nine. */
export function badgeText(count: number): string {
  return count > 9 ? '9+' : String(count);
}
