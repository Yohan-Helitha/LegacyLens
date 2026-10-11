import { creatorScreenForNotification } from '../../src/navigation/creatorNotificationRouting';

describe('creatorScreenForNotification', () => {
  it('opens the rejected applications for a rejection', () => {
    expect(creatorScreenForNotification({ type: 'application-rejected' })).toBe('rejected-applications');
  });

  it('opens the dashboard, where it is booked, for an approval', () => {
    expect(creatorScreenForNotification({ type: 'application-approved' })).toBe('dashboard');
  });

  it('opens the opportunities for an urgent opportunity alert', () => {
    expect(creatorScreenForNotification({ type: 'urgent-opportunity' })).toBe('market');
  });

  it('opens Rejected Submissions for reviewer feedback on submitted work', () => {
    expect(creatorScreenForNotification({ type: 'work-feedback' })).toBe('rejected-work');
  });

  it('just opens the app for anything else', () => {
    expect(creatorScreenForNotification({ type: 'something-new' })).toBeNull();
    expect(creatorScreenForNotification({})).toBeNull();
    expect(creatorScreenForNotification(null)).toBeNull();
    expect(creatorScreenForNotification(undefined)).toBeNull();
  });
});
