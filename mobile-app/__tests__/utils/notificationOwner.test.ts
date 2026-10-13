import { isForUser } from '../../src/utils/notificationOwner';

describe('isForUser', () => {
  it('is true only for the person the notification was meant for', () => {
    expect(isForUser({ recipientId: 'creator-1' }, 'creator-1')).toBe(true);
    expect(isForUser({ recipientId: 'creator-1' }, 'elder-1')).toBe(false);
  });

  it('is false when nobody is signed in', () => {
    expect(isForUser({ recipientId: 'creator-1' }, null)).toBe(false);
    expect(isForUser({ recipientId: 'creator-1' }, undefined)).toBe(false);
  });

  it('is false for a notification that does not say who it is for', () => {
    expect(isForUser({}, 'creator-1')).toBe(false);
    expect(isForUser(null, 'creator-1')).toBe(false);
    expect(isForUser({ recipientId: 42 }, 'creator-1')).toBe(false);
  });
});
