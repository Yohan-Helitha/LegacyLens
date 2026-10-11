import { badgeText, groupApplications, sentLabel } from '../../src/utils/applicationGroups';
import type { OpportunityApplicationResponse } from '../../src/types/opportunityApplication';

function application(status: OpportunityApplicationResponse['status']): OpportunityApplicationResponse {
  return { id: status + Math.random(), status } as OpportunityApplicationResponse;
}

describe('groupApplications', () => {
  it('splits drafts, waiting and rejected, and still counts a rejected one as sent', () => {
    const groups = groupApplications([
      application('SAVED'),
      application('PENDING'),
      application('REJECTED'),
      application('REJECTED'),
    ]);

    expect(groups.saved).toHaveLength(1);
    expect(groups.waiting).toHaveLength(1);
    expect(groups.rejected).toHaveLength(2);
    expect(groups.sentCount).toBe(3);
  });

  it('leaves approved and booked applications out of the sent count - they have moved on to booking', () => {
    const groups = groupApplications([application('APPROVED'), application('BOOKED'), application('PENDING')]);

    expect(groups.sentCount).toBe(1);
    expect(groups.saved).toHaveLength(0);
    expect(groups.rejected).toHaveLength(0);
  });

  it('rejecting an application does not change the sent count', () => {
    const before = groupApplications([application('PENDING'), application('PENDING')]);
    const after = groupApplications([application('PENDING'), application('REJECTED')]);

    expect(after.sentCount).toBe(before.sentCount);
    expect(after.waiting).toHaveLength(1);
    expect(after.rejected).toHaveLength(1);
  });
});

describe('unseen rejections', () => {
  it('counts only the rejected applications not looked at yet', () => {
    const seen = { ...application('REJECTED'), rejectionSeenAt: '2026-10-10T20:00:00' };
    const groups = groupApplications([seen, application('REJECTED'), application('PENDING')]);

    expect(groups.rejected).toHaveLength(2);
    expect(groups.unseenRejected).toHaveLength(1);
  });

  it('is empty once everything has been looked at, and ignores applications that are not rejected', () => {
    const seen = { ...application('REJECTED'), rejectionSeenAt: '2026-10-10T20:00:00' };

    expect(groupApplications([seen, application('PENDING'), application('SAVED')]).unseenRejected).toHaveLength(0);
  });
});

describe('unseen approvals', () => {
  it('counts only the approved applications not looked at yet', () => {
    const seen = { ...application('APPROVED'), approvalSeenAt: '2026-10-10T20:00:00' };
    const groups = groupApplications([seen, application('APPROVED'), application('PENDING')]);

    expect(groups.approved).toHaveLength(2);
    expect(groups.unseenApproved).toHaveLength(1);
  });

  it('stops counting an approval once it has been booked', () => {
    expect(groupApplications([application('BOOKED')]).unseenApproved).toHaveLength(0);
  });
});

describe('labels', () => {
  it('words the sent count', () => {
    expect(sentLabel(2)).toBe('2 sent');
  });

  it('caps the badge at 9+', () => {
    expect(badgeText(1)).toBe('1');
    expect(badgeText(9)).toBe('9');
    expect(badgeText(10)).toBe('9+');
  });
});
