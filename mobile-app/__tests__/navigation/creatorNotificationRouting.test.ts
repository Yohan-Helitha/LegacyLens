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

  it('opens My Work when submitted work is approved', () => {
    expect(creatorScreenForNotification({ type: 'work-approved' })).toBe('my-work');
  });

  it('opens the dashboard for the today-work reminder', () => {
    expect(creatorScreenForNotification({ type: 'today-work' })).toBe('dashboard');
  });

  it('opens the application status page for the admin decision on becoming a creator', () => {
    expect(creatorScreenForNotification({ type: 'creator-application-approved' })).toBe('pending');
    expect(creatorScreenForNotification({ type: 'creator-application-rejected' })).toBe('pending');
  });

  it('opens the inbox for a new message', () => {
    expect(creatorScreenForNotification({ type: 'new-message', conversationId: 'abc' })).toBe('inbox');
  });

  it('just opens the app for anything else', () => {
    expect(creatorScreenForNotification({ type: 'something-new' })).toBeNull();
    expect(creatorScreenForNotification({})).toBeNull();
    expect(creatorScreenForNotification(null)).toBeNull();
    expect(creatorScreenForNotification(undefined)).toBeNull();
  });
});
