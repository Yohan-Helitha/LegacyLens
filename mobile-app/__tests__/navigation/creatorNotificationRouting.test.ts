import { creatorScreenForNotification } from '../../src/navigation/creatorNotificationRouting';

describe('creatorScreenForNotification', () => {
  it('opens the rejected applications for a rejection', () => {
    expect(creatorScreenForNotification({ type: 'application-rejected' })).toBe('rejected-applications');
  });

  it('opens My Applications, where the approval is listed, for an approval', () => {
    expect(creatorScreenForNotification({ type: 'application-approved' })).toBe('saved-applications');
  });

  it('just opens the app for anything else', () => {
    expect(creatorScreenForNotification({ type: 'something-new' })).toBeNull();
    expect(creatorScreenForNotification({})).toBeNull();
    expect(creatorScreenForNotification(null)).toBeNull();
    expect(creatorScreenForNotification(undefined)).toBeNull();
  });
});
