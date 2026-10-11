import { creatorScreenForNotification } from '../../src/utils/notificationRouting';

describe('creatorScreenForNotification', () => {
  it('opens the rejected applications for a rejection', () => {
    expect(creatorScreenForNotification({ type: 'application-rejected' })).toBe('rejected-applications');
  });

  it('opens the dashboard, where it is booked, for an approval', () => {
    expect(creatorScreenForNotification({ type: 'application-approved' })).toBe('dashboard');
  });

  it('just opens the app for anything else', () => {
    expect(creatorScreenForNotification({ type: 'something-new' })).toBeNull();
    expect(creatorScreenForNotification({})).toBeNull();
    expect(creatorScreenForNotification(null)).toBeNull();
    expect(creatorScreenForNotification(undefined)).toBeNull();
  });
});
