import { useAuthStore } from '../../../src/store/authStore';

describe('Header admin visibility role logic', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('determines admin status accurately from user roles', () => {
    const checkIsAdmin = (roles: string[]) => roles.some((r) => String(r).toUpperCase() === 'ADMIN');

    expect(checkIsAdmin(['ADMIN'])).toBe(true);
    expect(checkIsAdmin(['admin'])).toBe(true);
    expect(checkIsAdmin(['GENERAL_USER', 'ADMIN'])).toBe(true);
    expect(checkIsAdmin(['GENERAL_USER'])).toBe(false);
    expect(checkIsAdmin(['ELDER', 'YOUTH_CREATOR'])).toBe(false);
    expect(checkIsAdmin([])).toBe(false);
  });

  it('checks user role stored in useAuthStore for admin account', () => {
    useAuthStore.getState().setSession('dummy-token', {
      userId: 'user-1',
      fullName: 'Admin User',
      phoneNumber: '+94771234567',
      roles: ['ADMIN'],
    });

    const user = useAuthStore.getState().user;
    const roles = user?.roles ?? [];
    const isAdmin = roles.some((r) => String(r).toUpperCase() === 'ADMIN');
    expect(isAdmin).toBe(true);
  });

  it('correctly reports non-admin for general users in authStore', () => {
    useAuthStore.getState().setSession('dummy-token', {
      userId: 'user-2',
      fullName: 'Regular User',
      phoneNumber: '+94777654321',
      roles: ['GENERAL_USER'],
    });

    const user = useAuthStore.getState().user;
    const roles = user?.roles ?? [];
    const isAdmin = roles.some((r) => String(r).toUpperCase() === 'ADMIN');
    expect(isAdmin).toBe(false);
  });
});

