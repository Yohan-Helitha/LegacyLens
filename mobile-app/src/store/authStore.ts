import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
  userId: string;
  fullName: string;
  phoneNumber: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /**
   * Device-local preference set once the user completes the "Enable
   * Fingerprint" onboarding step. The backend has no endpoint to read or
   * write this yet (User.fingerprintEnabled is read-only via /users/me),
   * so it's tracked here and used purely to gate the Login screen's
   * fingerprint tab — real device biometrics still unlock a cached session,
   * not a server call.
   */
  fingerprintEnabled: boolean;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  setFingerprintEnabled: (enabled: boolean) => void;
}

/** Adapts expo-secure-store (Keychain/Keystore-backed) to zustand's StateStorage shape. */
const secureStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
};

/**
 * Holds the current session (JWT + user summary). The token is only ever
 * set after a real POST /api/auth/login succeeds — registration and
 * PIN-reset also return a token, but the app deliberately routes back to
 * the login screen after those instead of auto-authenticating.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      fingerprintEnabled: false,
      setSession: (token, user) => set({ token, user, isAuthenticated: true }),
      clearSession: () => set({ token: null, user: null, isAuthenticated: false }),
      setFingerprintEnabled: (enabled) => set({ fingerprintEnabled: enabled }),
    }),
    {
      name: 'legacylens-auth',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
